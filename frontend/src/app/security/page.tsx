"use client"
import BlurText from '@/components/BlurText/BlurText';
import Image from 'next/image';
import { useState } from 'react';

const securityGraphs = [
  'tdp_qimle_security_analysis.png',
  'tdp_qimle_performance_analysis.png',
  'security_comparison.png',
  'performance_comparison.png',
  'graph3_sensitivity_analysis.png',
  'graph2_security_features.png',
  'graph1_performance_comparison.png',
  'tdp_qimle_comprehensive_analysis.png',
];

function formatCaption(filename: string) {
  return filename
    .replace(/_/g, ' ')
    .replace(/\.png$/, '')
    .replace(/\btdp qimle\b/i, 'TDP-QIMLE')
    .replace(/\bgraph(\d+)/i, 'Graph $1')
    .replace(/\bperformance\b/i, 'Performance')
    .replace(/\bsecurity\b/i, 'Security')
    .replace(/\bcomparison\b/i, 'Comparison')
    .replace(/\bcomprehensive\b/i, 'Comprehensive')
    .replace(/\banalysis\b/i, 'Analysis')
    .replace(/\bfeatures\b/i, 'Features')
    .replace(/\bsensitivity\b/i, 'Sensitivity')
    .replace(/\bassessment\b/i, 'Assessment')
    .replace(/\bmonitoring\b/i, 'Monitoring')
    .replace(/\bresults\b/i, 'Results')
    .replace(/\bcomparison\b/i, 'Comparison')
    .replace(/\bcompliance\b/i, 'Compliance')
    .replace(/\btdp qimle\b/i, 'TDP-QIMLE')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export default function SecurityPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImg, setModalImg] = useState<string | null>(null);

  const openModal = (filename: string) => {
    setModalImg(filename);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setModalImg(null);
  };

  return (
    <div className="bg-white min-h-screen max-w-screen mx-auto py-12 px-4 text-black">
      <BlurText
            text="Security Analysis"
            delay={150}
            animateBy="words"
            direction="top"
            className="text-8xl mb-2 mt-20 text-center items-center justify-center font-bold"
          />
      <p className="text-2xl text-muted-foreground mb-10 text-center">
        Comprehensive security assessment and compliance monitoring
      </p>
      <div className="grid gap-12 md:grid-cols-2 max-w-7xl mx-auto text-white">
        {securityGraphs.map((filename) => (
          <div
            key={filename}
            className="flex flex-col items-center bg-white/80 dark:bg-white border-2 border-black shadow-2xl rounded-2xl p-4 transition-transform duration-200 hover:scale-105 cursor-zoom-in h-full min-h-[420px]"
            onClick={() => openModal(filename)}
            tabIndex={0}
            role="button"
            aria-label={`Open ${formatCaption(filename)} in full view`}
            style={{height: '100%'}}
          >
            <div className="flex-1 w-full flex flex-col items-center justify-center">
              <Image
                src={`/security/${filename}`}
                alt={filename}
                width={900}
                height={600}
                className="rounded shadow w-full max-w-2xl"
              />
            </div>
            <div className="w-full mt-auto">
              <p className="mt-2 text-3xl font-extralight text-center text-black">
                {formatCaption(filename)}
              </p>
            </div>
          </div>
        ))}
      </div>
      {/* Modal for full view */}
      {modalOpen && modalImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="relative bg-transparent p-4 flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-white text-3xl font-bold bg-black/50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/80 transition"
              onClick={closeModal}
              aria-label="Close full view"
            >
              &times;
            </button>
            <Image
              src={`/security/${modalImg}`}
              alt={modalImg}
              width={1200}
              height={900}
              className="rounded shadow-lg max-h-[80vh] w-auto h-auto"
            />
            <p className="mt-4 text-2xl text-white text-center font-bold drop-shadow-lg">
              {formatCaption(modalImg)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 