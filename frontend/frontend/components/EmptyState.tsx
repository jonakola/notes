import Image from 'next/image';

export default function EmptyState() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center p-5">
      <div className="relative mb-5" style={{ width: '315px', height: '315px' }}>
        <Image 
          src="/tea.png"
          alt="Bubble tea illustration"
          fill
          style={{ objectFit: 'contain' }}
          priority
        />
      </div>
      <p className="text-[#8B6E4E] text-xl font-medium text-center">
        I'm just here waiting for your charming notes...
      </p>
    </div>
  );
}