import React, { useState, useRef, useEffect } from 'react';

interface ConversationButtonProps {
  className?: string;
  onSummaryReceived?: (summary: string) => void;
}

// Define proper TypeScript types
interface RTCConnectionState {
  stream: MediaStream | null;
  track: MediaStreamTrack | null;
  pc: RTCPeerConnection | null;
  dc: RTCDataChannel | null;
}

const ConversationButton: React.FC<ConversationButtonProps> = ({ className, onSummaryReceived }) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentSummary, setCurrentSummary] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<RTCConnectionState>({
    stream: null,
    track: null,
    pc: null,
    dc: null
  });
  
  // Use useRef to access the audio element
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  
  // Use this ref to store the current data channel during setup
  const dcRef = useRef<RTCDataChannel | null>(null);

  const defaultVoice = "alloy";
  const defaultSessionInstructions = "You are a helpful personal assistant. Users will chat with you about various ideas they may have. Your role is to listen and understand. There is no need to summarize the idea";
  const defaultStartInstructions = "Greet the user and tell them you are ready to chat about their idea.";
  const temperature = 1;
  const gptFunctions = [
    {
        type: "function",
        name: "end_of_idea",
        description: "the user has nothing else to share about their idea and wants to end the conversation",
        parameters: {
            type: "object",
            properties: {
              summary: {
                type: 'string',
                description: 'a summary of the idea'
              }
            },
            required: ['summary']
        }
    }
  ]; 

  // Set up session with initial messages
  const setupSession = (dataChannel: RTCDataChannel) => {
    if (dataChannel && dataChannel.readyState === "open") {
      console.log("Setting up session...");
      
      // Clear localStorage if needed
      if (typeof window !== "undefined") {
        localStorage.clear();
      }
      
      // Get configuration from localStorage or use defaults
      const sessionInstruct = typeof window !== "undefined" 
        ? (localStorage.getItem("sessionInstructions") || defaultSessionInstructions) 
        : defaultSessionInstructions;
        
      const startInstruct = typeof window !== "undefined"
        ? (localStorage.getItem("startInstructions") || defaultStartInstructions)
        : defaultStartInstructions;
      
      // Prepare and send the system configuration message
      const systemMessage = {
        type: "session.update",
        session: {
          instructions: sessionInstruct,
          voice: defaultVoice,
          tools: gptFunctions,
          tool_choice: "auto",
          input_audio_transcription: { model: "whisper-1" },
          temperature: temperature,
        },
      };
      
      dataChannel.send(JSON.stringify(systemMessage));
      console.log("Sent system message");
      
      // Prepare and send the start message
      const startMessage = {
        type: "response.create",
        response: {
          modalities: ["text", "audio"],
          instructions: startInstruct,
          max_output_tokens: 256
        },
      };
      
      dataChannel.send(JSON.stringify(startMessage));
      console.log("Sent start message");
      return true;
    } else {
      console.error("Data channel not ready for session setup, state:", dataChannel?.readyState);
      return false;
    }
  };

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      stopConnection();
    };
  }, []);

  // Setup audio and WebRTC connection
  const setupAudio = async () => {
    try {
      // Check if we're in a browser environment (important for Next.js SSR)
      if (typeof window === 'undefined' || !navigator.mediaDevices) {
        console.error("MediaDevices API not available");
        return false;
      }

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (!stream) {
        console.error("Unable to open stream");
        return false;
      }
      
      const track = stream.getAudioTracks()[0];
      
      // Create RTCPeerConnection
      const pc = new RTCPeerConnection();
      
      // Set the remote audio as the source object
      if (remoteAudioRef.current) {
        pc.ontrack = (e) => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = e.streams[0];
          }
        };
      }
      
      // Add the local audio track to the connection
      pc.addTrack(track, stream);
      
      // Create a data channel
      const dc = pc.createDataChannel('oai-events');
      
      // Store in ref for immediate access in event listeners
      dcRef.current = dc;
      
      dc.addEventListener("open", () => {
        console.log("Data channel opened");
        // Use the data channel directly from the event
        setupSession(dc);
      });
      
      dc.addEventListener("message", handleMessage);
      
      // Create and set local description
      await pc.setLocalDescription();

      if (!pc.localDescription) {
        console.error("Failed to set local description");
        return false;
      }
      
      // Connect to the API
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = process.env.NEXT_PUBLIC_OPENAI_MODEL || "gpt-4o-mini-realtime-preview";
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      
      if (!apiKey) {
        console.error("OpenAI API key is missing");
        return false;
      }
      
      const response = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: pc.localDescription.sdp,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/sdp"
        },
      });
      
      if (!response.ok) {
        console.error("Failed to fetch SDP answer: ", await response.text());
        return false;
      }
      
      const answerSdp = await response.text();
      const answer = { type: "answer", sdp: answerSdp } as RTCSessionDescriptionInit;
      console.log("Received answer:", answer);
      
      // Set the remote description
      await pc.setRemoteDescription(answer);
      
      // Wait for connection to establish
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(`Connection timeout. Current state: ${pc.connectionState}`), 10000);
        
        pc.addEventListener("connectionstatechange", () => {
          if (pc.connectionState === "connected") {
            clearTimeout(timeout);
            console.log("Peer connection established!");
            resolve();
          }
        });
      });
      
      // Update connection state
      setConnectionState({ stream, track, pc, dc });
      console.log("Connection successful");
      return true;
      
    } catch (err) {
      console.error("Failed to setup connection:", err);
      stopConnection();
      return false;
    }
  };

  // Handle the summary generation
  const summarize = (args: string, call_id: string) => {
    console.log("summarizing text");
    const parsedArgs = JSON.parse(args);
    const summaryText = parsedArgs.summary;
    console.log(summaryText);
    
    let message;
    
    // If there's an existing summary, this is an edit request
    if (currentSummary) {
      console.log("Editing existing summary");
      
      message = {
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: call_id,
          output: JSON.stringify({ 
            originalSummary: currentSummary,
            latestSummary: summaryText
          }),
          instruction: "rewrite the latest summary so that it looks more like an edited version of the originalSummary"
        }
      };
      
      // Clear the current summary after editing
      setCurrentSummary(null);

      console.log(JSON.stringify(message));
      dcRef.current?.send(JSON.stringify(message));
      dcRef.current?.send(JSON.stringify({ type: "conversation.item.create", item: { instruction: "I have nothing else to share and want to end the conversation"} }));
      dcRef.current?.send(JSON.stringify({ type: "response.create", }));
      console.log("sent message");
    } else {
      // This is a new summary
      console.log("Creating new summary");
      
      // Store the summary for potential editing later
      setCurrentSummary(summaryText);
      
      message = {
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: call_id,
          output: JSON.stringify({ 
            message: "I've noted down your idea. If you'd like to share more or make edits, please continue."
          })
        }
      };
      
      // Call the parent component's callback for a new summary
      if (onSummaryReceived) {
        onSummaryReceived(summaryText);
      }

      console.log(JSON.stringify(message));
      dcRef.current?.send(JSON.stringify(message));
      dcRef.current?.send(JSON.stringify({ type: "response.create" }));
      console.log("sent message");
    }
    
  };

  // Handle messages from the data channel
  const handleMessage = (event: MessageEvent) => {
    try {
      let msg = JSON.parse(event.data);
      console.log(msg);
      
      let itemId = msg.item_id;

      switch (msg.type) {
        case "response.function_call_arguments.done":
          console.log("Model has finished processing function call arguments.");
          const {name, arguments: args, call_id} = msg;

          if (name === "end_of_idea") {
            console.log("Summarizing user idea");
            summarize(args, call_id);
          }
          break;
      }
    } catch (err) {
      console.error("Error parsing message:", err);
    }
  };

  // Stop the connection and free resources
  const stopConnection = () => {
    const { stream, track, pc, dc } = connectionState;
    
    if (dc) {
      dc.close();
    }
    
    if (pc && pc.connectionState !== "closed") {
      pc.close();
    }
    
    if (track) {
      track.stop();
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    // Reset the connection state
    setConnectionState({
      stream: null,
      track: null,
      pc: null,
      dc: null
    });
    
    // Clear reference
    dcRef.current = null;
    
    // Reset audio element
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    
    console.log("Connection stopped and resources freed");
  };

  // Handle button click
  const handleClick = async () => {
    if (!isActive) {
      console.log('Starting conversation...');
      const success = await setupAudio();
      
      if (success) {
        setIsActive(true);
        console.log('Conversation started successfully');
        
        // If the data channel is already open but the event hasn't fired,
        // setup the session manually
        if (dcRef.current && dcRef.current.readyState === "open") {
          console.log("Data channel already open, setting up session manually");
          setupSession(dcRef.current);
        }
      } else {
        console.error('Failed to start conversation');
      }
    } else {
      console.log('Ending conversation...');
      stopConnection();
      setIsActive(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleClick}
        className={`w-10 h-10 rounded-full ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-[#8B7E74] hover:bg-[#6c635c]'} text-white flex items-center justify-center transition-colors duration-200 shadow-md`}
        aria-label={isActive ? "End conversation" : "Start conversation"}
      >
        <HeadsetIcon />
      </button>
      <div className="absolute bottom-full mb-2 right-0 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        {isActive ? "End conversation" : "Start conversation"}
      </div>
      <audio 
        ref={remoteAudioRef} 
        id="remote-audio" 
        autoPlay 
      />
    </div>
  );
};

// Simple headset icon component
const HeadsetIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5z"></path>
    <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5z"></path>
  </svg>
);

export default ConversationButton;