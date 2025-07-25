'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Shield, Database, Layers, Zap, Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BlurText from '@/components/BlurText/BlurText';
import ScrollVelocity from '@/components/ScrollVelocity/ScrollVelocity'

export default function AlgorithmPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Star className="w-4 h-4" /> },
    { id: 'quantum', label: 'Quantum Layers', icon: <Zap className="w-4 h-4" /> },
    { id: 'lattice', label: 'Lattice Obfuscation', icon: <Database className="w-4 h-4" /> },
    { id: 'biological', label: 'Biological Evolution', icon: <Layers className="w-4 h-4" /> },
    { id: 'security', label: 'Security Features', icon: <Shield className="w-4 h-4" /> },
    { id: 'implementation', label: 'Implementation', icon: <Lock className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <div className="max-w-[120rem] mx-auto">
        {/* Header */}
        <div className="mb-12">
        <Button 
                variant="ghost" 
                onClick={() => router.push('/')}
                className="mb-4 text-2xl"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
          
          <div className="space-y-4">
            <BlurText
            text="TDP-QIMLE Algorithm"
            delay={150}
            animateBy="words"
            direction="top"
            className="md:text-8xl text-5xl lg:text-8xl mb-2 mt-20 text-center items-center justify-center font-bold"
          />
            <p className="text-xl md:text-2xl sm:text-2xl lg:text-2xl text-muted-foreground max-w-3xl text-center mx-auto">
              Temporal Differential Privacy with Quantum-Inspired Multi-Layer Encryption
            </p>
            <div className="flex flex-wrap gap-2 justify-center ">
              <Badge className='bg-zinc-800 hover:bg-zinc-700 text-xl font-extralight' variant="outline">Version 3.0.0</Badge>
              <Badge className='bg-zinc-800 hover:bg-zinc-700 text-xl font-extralight' variant="outline">Post-Quantum Secure</Badge>
              <Badge className='bg-zinc-800 hover:bg-zinc-700 text-xl font-extralight' variant="outline">Research Implementation</Badge>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 p-2 bg-blue-500 border-2 rounded-lg w-fit mx-auto justify-center ">
            {tabs.map(tab => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 border-2 text-xl hover:bg-zinc-900 hover:text-white"
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-4xl">Algorithm Overview</CardTitle>
                  <CardDescription className='text-2xl mt-6 ml-6'>
                    TDP-QIMLE is a revolutionary encryption algorithm that combines cutting-edge cryptographic 
                    techniques to provide unprecedented security for healthcare data.
                  </CardDescription>
                </CardHeader>
                <CardContent className='text-2xl ml-6'>
                  <p className="text-muted-foreground mb-6">
                    The algorithm integrates quantum-inspired encryption, lattice-based obfuscation, and 
                    biological pattern evolution to create a post-quantum secure system with mathematical 
                    privacy guarantees.
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center">
                        <Shield className="h-5 w-5 text-black" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold ">Quantum-Inspired Encryption</CardTitle>
                      
                      </div>
                    </div>
                    <CardDescription className='text-xl'>Four quantum-inspired layers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg text-muted-foreground font-normal">
                      Simulate quantum superposition, entanglement, collapse, and coherence states 
                      for enhanced security with mathematical reversibility.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center">
                        <Zap className="h-5 w-5 text-black" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold">Lattice Obfuscation</CardTitle>
                       
                      </div>
                    </div>
                    <CardDescription className='text-xl'>128-dimensional transformations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg text-muted-foreground font-normal">
                      High-dimensional mathematical obfuscation with QR decomposition for 
                      numerical stability and quantum resistance.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center">
                        <Layers className="h-5 w-5 text-black" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold">Biological Evolution</CardTitle>
                      
                      </div>
                    </div>
                    <CardDescription className='text-xl'>DNA-inspired key generation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg text-muted-foreground font-normal">
                      1000-element biological sequence with golden ratio growth and 
                      5% mutation rate for dynamic, unpredictable keys.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center">
                        <Lock className="h-5 w-5 text-black" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold">Temporal Privacy</CardTitle>
                      </div>
                    </div>
                    <CardDescription className='text-xl'>Time-decay mechanisms</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg text-muted-foreground font-normal">
                      Mathematical privacy guarantees with ε=1.0, δ=1e-5 budget 
                      and adaptive sensitivity scaling.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-muted/20">
                <CardHeader>
                  <CardTitle className="text-4xl font-extralight">Encryption Process Flow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-2 text-xl">
                    <Badge variant="secondary" className='text-xl bg-white hover:bg-zinc-700 hover:text-white h-10 border-2 border-black'>Patient Data</Badge>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary" className='text-xl bg-white hover:bg-zinc-700 hover:text-white h-10 border-2 border-black'>Quantum Layers</Badge>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary" className='text-xl bg-white hover:bg-zinc-700 hover:text-white h-10 border-2 border-black'>Lattice Obfuscation</Badge>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary" className='text-xl bg-white hover:bg-zinc-700 hover:text-white h-10 border-2 border-black'>AES Encryption</Badge>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary" className='text-xl bg-white hover:bg-zinc-700 hover:text-white h-10 border-2 border-black'>Homomorphic Transform</Badge>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary" className='text-xl bg-white hover:bg-zinc-700 hover:text-white h-10 border-2 border-black'>Integrity Block</Badge>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary" className='text-xl bg-white hover:bg-zinc-700 hover:text-white h-10 border-2 border-black'>Secure Storage</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'quantum' && (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-4xl font-bold">Quantum-Inspired Encryption Layers</CardTitle>
                  <CardDescription className='text-2xl'>
                    Four distinct quantum-inspired encryption layers, each simulating different 
                    quantum mechanical phenomena for enhanced security.
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-blue-200 dark:border-black">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <div className="w-12 h-12 bg-white border-2 border-black rounded-full flex items-center justify-center">
                        <span className="text-black text-md">🌊</span>
                      </div>
                      SUPERPOSITION Layer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-lg">
                    <div className="space-y-2 text-lg">
                      <p><strong>Mechanism:</strong> Complex amplitude transformations</p>
                      <p><strong>Operation:</strong> XOR with real and imaginary amplitude factors</p>
                      <p><strong>Security:</strong> Simulates quantum superposition states</p>
                      <p><strong>Reversibility:</strong> Mathematically exact using XOR properties</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 dark:border-black">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <div className="w-12 h-12 bg-white border-2 border-black rounded-full flex items-center justify-center">
                        <span className="text-black text-md">🔗</span>
                      </div>
                      ENTANGLED Layer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-lg">
                    <div className="space-y-2 text-lg">
                      <p><strong>Mechanism:</strong> Position-based correlation encryption</p>
                      <p><strong>Operation:</strong> XOR with position factor and entanglement key</p>
                      <p><strong>Security:</strong> Creates interdependent byte relationships</p>
                      <p><strong>Reversibility:</strong> Position-based for mathematical stability</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200 dark:border-black">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <div className="w-12 h-12 bg-white border-2 border-black rounded-full flex items-center justify-center">
                        <span className="text-black text-md">💥</span>
                      </div>
                      COLLAPSED Layer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-lg">
                    <div className="space-y-2 text-lg">
                      <p><strong>Mechanism:</strong> Phase-shift transformations</p>
                      <p><strong>Operation:</strong> XOR with phase-derived factors</p>
                      <p><strong>Security:</strong> Simulates wave function collapse</p>
                      <p><strong>Reversibility:</strong> Direct XOR inversion</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-orange-200 dark:border-black">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <div className="w-12 h-12 bg-white border-2 border-black rounded-full flex items-center justify-center">
                        <span className="text-black text-md">✨</span>
                      </div>
                      COHERENT Layer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-lg">
                    <div className="space-y-2 text-lg">
                      <p><strong>Mechanism:</strong> Amplitude-phase combination</p>
                      <p><strong>Operation:</strong> XOR with combined amplitude and phase factors</p>
                      <p><strong>Security:</strong> Coherent state simulation</p>
                      <p><strong>Reversibility:</strong> Exact mathematical inversion</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-muted/20">
                <CardHeader>
                  <CardTitle className="text-4xl font-extralight">Quantum Layer Processing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xl">
                    <p><strong>Forward Processing:</strong> Data passes through layers 0→1→2→3</p>
                    <p><strong>Reverse Processing:</strong> Decryption reverses layers 3→2→1→0</p>
                    <p><strong>Mathematical Guarantee:</strong> All operations are XOR-based for perfect reversibility</p>
                    <p><strong>Security Benefit:</strong> Multiple transformation layers increase cryptographic strength</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'lattice' && (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-4xl font-bold">Multi-Dimensional Lattice Obfuscation</CardTitle>
                  <CardDescription className='text-2xl'>
                    High-dimensional mathematical transformations to obscure data patterns 
                    while maintaining complete recoverability.
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <div className="w-12 h-12 bg-white border-2 border-black rounded-full flex items-center justify-center">
                        <Zap className="h-5 w-5 text-black" />
                      </div>
                      Lattice Parameters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-lg">
                    <div className="space-y-2 text-lg">
                      <p><strong>Dimension:</strong> 128-dimensional lattice space</p>
                      <p><strong>Basis Generation:</strong> QR decomposition for numerical stability</p>
                      <p><strong>Noise Injection:</strong> Sensitivity-based Gaussian noise</p>
                      <p><strong>Data Handling:</strong> Supports data longer than lattice dimension</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <div className="w-12 h-12 bg-white border-2 border-black rounded-full flex items-center justify-center">
                        <Shield className="h-5 w-5 text-black" />
                      </div>
                      Transformation Process
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-lg">
                    <div className="space-y-2 text-lg">
                      <p><strong>Step 1:</strong> Convert data to lattice coordinates</p>
                      <p><strong>Step 2:</strong> Add sensitivity-based noise vector</p>
                      <p><strong>Step 3:</strong> Apply lattice basis transformation</p>
                      <p><strong>Step 4:</strong> Store full data vector for recovery</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-4xl font-extralight">Mathematical Foundation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xl">
                    <p><strong>Lattice Basis:</strong> Well-conditioned matrix generated using QR decomposition</p>
                    <p><strong>Transformation:</strong> obfuscated = basis × (data + noise)</p>
                    <p><strong>Recovery:</strong> data = stored_coordinates (exact recovery)</p>
                    <p><strong>Security:</strong> High-dimensional space makes pattern analysis difficult</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'biological' && (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-4xl font-bold">Biological Pattern Key Evolution</CardTitle>
                  <CardDescription className='text-2xl'>
                    The key evolution system mimics biological processes to create dynamic, 
                    unpredictable encryption keys that evolve over time.
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <div className="w-12 h-12 bg-white border-2 border-black rounded-full flex items-center justify-center">
                        <Layers className="h-5 w-5 text-black" />
                      </div>
                      DNA-Inspired Sequence
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-lg">
                    <div className="space-y-2 text-lg">
                      <p><strong>Length:</strong> 1000 elements</p>
                      <p><strong>Growth Pattern:</strong> Golden ratio (φ = 1.618...)</p>
                      <p><strong>Mutation Rate:</strong> 5% for genetic diversity</p>
                      <p><strong>Deterministic:</strong> Seeded with master key</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <div className="w-12 h-12 bg-white border-2 border-black rounded-full flex items-center justify-center">
                        <Shield className="h-5 w-5 text-black" />
                      </div>
                      Key Evolution Process
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-lg">
                    <div className="space-y-2 text-lg">
                      <p><strong>Time Index:</strong> timestamp % sequence_length</p>
                      <p><strong>Evolution Factor:</strong> biological_sequence[time_index]</p>
                      <p><strong>Key Material:</strong> master_key + evolution_factor</p>
                      <p><strong>Strengthening:</strong> 1000 SHA256 iterations</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="text-4xl font-extralight">Biological Simulation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xl">
                    <p><strong>Fibonacci-like Growth:</strong> next_val = (current × φ) mod 2³²</p>
                    <p><strong>Mutation Mechanism:</strong> 5% chance of doubling based on deterministic hash</p>
                    <p><strong>Genetic Diversity:</strong> Mutations prevent sequence stagnation</p>
                    <p><strong>Evolutionary Pressure:</strong> Time-based selection of sequence elements</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-4xl font-bold">Advanced Security Features</CardTitle>
                  <CardDescription className='text-2xl'>
                    TDP-QIMLE incorporates multiple layers of security mechanisms to provide 
                    comprehensive protection against various attack vectors.
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-red-200 dark:border-red-800">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <div className="w-12 h-12 bg-white border-2 border-black rounded-full flex items-center justify-center">
                        <Shield className="h-5 w-5 text-black" />
                      </div>
                      Post-Quantum Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-lg">
                    <div className="space-y-2 text-lg">
                      <p><strong>Lattice-Based:</strong> Resistant to quantum attacks</p>
                      <p><strong>Multi-Layer Defense:</strong> Multiple encryption layers</p>
                      <p><strong>Quantum-Inspired:</strong> Leverages quantum principles</p>
                      <p><strong>Future-Proof:</strong> Designed for quantum computing era</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <div className="w-12 h-12 bg-white border-2 border-black rounded-full flex items-center justify-center">
                        <Lock className="h-5 w-5 text-black" />
                      </div>
                      Cryptographic Strength
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-lg">
                    <div className="space-y-2 text-lg">
                      <p><strong>AES-256:</strong> Industry-standard symmetric encryption</p>
                      <p><strong>Key Evolution:</strong> Dynamic key generation</p>
                      <p><strong>Hash Strengthening:</strong> 1000 SHA256 iterations</p>
                      <p><strong>Deterministic:</strong> Reproducible for decryption</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="text-4xl font-extralight">Attack Resistance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xl">
                    <div className="space-y-2">
                      <p><strong>✓ Quantum Attacks:</strong> Lattice-based resistance</p>
                      <p><strong>✓ Pattern Analysis:</strong> Multi-layer obfuscation</p>
                      <p><strong>✓ Timing Attacks:</strong> Deterministic operations</p>
                      <p><strong>✓ Side-Channel:</strong> Mathematical transformations</p>
                    </div>
                    <div className="space-y-2">
                      <p><strong>✓ Brute Force:</strong> High-dimensional key space</p>
                      <p><strong>✓ Cryptanalysis:</strong> Novel algorithm design</p>
                      <p><strong>✓ Data Tampering:</strong> Integrity verification</p>
                      <p><strong>✓ Key Recovery:</strong> Biological evolution</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'implementation' && (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-4xl font-bold">Implementation Details</CardTitle>
                  <CardDescription className='text-2xl'>
                    Technical implementation specifications and performance characteristics 
                    of the TDP-QIMLE algorithm.
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <div className="w-12 h-12 bg-white border-2 border-black rounded-full flex items-center justify-center">
                        <Shield className="h-5 w-5 text-black" />
                      </div>
                      Algorithm Parameters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-lg">
                    <div className="space-y-2 text-lg">
                      <p><strong>Version:</strong> 3.0.0</p>
                      <p><strong>Lattice Dimension:</strong> 128</p>
                      <p><strong>Quantum Layers:</strong> 4</p>
                      <p><strong>Biological Sequence:</strong> 1000 elements</p>
                      <p><strong>Hash Iterations:</strong> 1000</p>
                      <p><strong>Homomorphic Modulus:</strong> 2³¹ - 1</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <div className="w-12 h-12 bg-white border-2 border-black rounded-full flex items-center justify-center">
                        <Shield className="h-5 w-5 text-black" />
                      </div>
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-lg">
                    <div className="space-y-2 text-lg">
                      <p><strong>Encryption Speed:</strong> Variable (sensitivity-dependent)</p>
                      <p><strong>Decryption Speed:</strong> Optimized for reversibility</p>
                      <p><strong>Storage Overhead:</strong> ~30-50% due to metadata</p>
                      <p><strong>Memory Usage:</strong> Lattice basis caching</p>
                      <p><strong>Key Generation:</strong> Deterministic, fast</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-muted/20">
                <CardHeader>
                  <CardTitle className="text-4xl font-extralight">Algorithm Workflow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-xl">
                    {[
                      { step: 1, title: "Data Serialization", desc: "JSON encoding of patient data", color: "bg-blue-500" },
                      { step: 2, title: "Quantum Processing", desc: "4-layer quantum-inspired encryption", color: "bg-purple-500" },
                      { step: 3, title: "Lattice Obfuscation", desc: "High-dimensional transformation", color: "bg-green-500" },
                      { step: 4, title: "AES Encryption", desc: "Industry-standard symmetric encryption", color: "bg-orange-500" },
                      { step: 5, title: "Homomorphic Transform", desc: "Encrypted domain operations", color: "bg-indigo-500" },
                      { step: 6, title: "Integrity Block", desc: "Blockchain-inspired verification", color: "bg-teal-500" },
                      { step: 7, title: "Secure Storage", desc: "MongoDB with metadata", color: "bg-gray-500" }
                    ].map((item) => (
                      <div key={item.step} className="flex items-start gap-3">
                        <div className={`w-8 h-8 ${item.color} text-white rounded-full flex items-center justify-center text-sm font-medium`}>
                          {item.step}
                        </div>
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        <div className="flex justify-center mt-20 mb-20"> 

        <Button size="lg" className="bg-blue-500 text-white hover:bg-zinc-800 hover:text-white h-20 w-fill text-2xl font-bold border-2 border-black" asChild>
                <Link href="/encrypt">
                  Encrypt Data Now!
                </Link>
              </Button>
        </div>
      </div>
    </div>
  )
} 