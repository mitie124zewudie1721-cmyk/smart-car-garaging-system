// src/components/FlipCard.tsx
import type { ReactNode } from 'react';

interface FlipCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  backTitle: string;
  backDetails: string[];
}

export default function FlipCard({ icon, title, description, backTitle, backDetails }: FlipCardProps) {
  return (
    <>
      <style>{`
                .sg-flip-card {
                    perspective: 1200px;
                    height: 340px;
                    width: 100%;
                }
                .sg-flip-inner {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    transform-style: preserve-3d;
                    transition: transform 0.75s cubic-bezier(0.4, 0.2, 0.2, 1);
                }
                .sg-flip-card:hover .sg-flip-inner {
                    transform: rotateY(180deg);
                }
                .sg-flip-front,
                .sg-flip-back {
                    position: absolute;
                    inset: 0;
                    backface-visibility: hidden;
                    -webkit-backface-visibility: hidden;
                    border-radius: 1rem;
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    overflow: hidden;
                }
                .sg-flip-back {
                    transform: rotateY(180deg);
                    justify-content: center;
                    background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
                }
                .sg-flip-front {
                    background: #ffffff;
                    border: 1px solid #c7d2fe;
                    box-shadow: 0 2px 16px rgba(99,102,241,0.08);
                    transition: border-color 0.3s ease, box-shadow 0.3s ease;
                }
                .sg-flip-card:hover .sg-flip-front {
                    border-color: #6366f1;
                    box-shadow: 0 0 0 1px #6366f1, 0 8px 32px rgba(99,102,241,0.18);
                }
            `}</style>

      <div className="sg-flip-card">
        <div className="sg-flip-inner">

          {/* FRONT */}
          <div className="sg-flip-front">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-5 shrink-0">
              {icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 leading-snug">{title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
            <div className="mt-auto pt-6 flex items-center gap-2 text-indigo-500 text-xs font-medium">
              <span>Hover to learn more</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* BACK */}
          <div className="sg-flip-back">
            <h3 className="text-lg font-bold text-white mb-5 leading-snug">{backTitle}</h3>
            <ul className="space-y-3">
              {backDetails.map((detail, i) => (
                <li key={i} className="flex items-start gap-3 text-indigo-100 text-sm leading-relaxed">
                  <svg className="w-4 h-4 mt-0.5 text-indigo-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {detail}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </>
  );
}
