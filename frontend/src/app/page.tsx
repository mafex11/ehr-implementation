import PatientList from '../components/PatientList'
import DPResult from '../components/DPResult'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Shield, Zap, Lock, Brain, Atom, Dna, Unlock, UserPlus, BarChart3 } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-grid-16" />
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold tracking-tight">
                <span className="text-white bg-clip-text">
                  Revolutionary Healthcare Technology
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-white">
                Advanced EHR privacy protection using Temporal Differential Privacy with 
                Quantum-Inspired Multi-Layer Encryption (TDP-QIMLE)
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg bg-zinc-900 hover:bg-zinc-800 px-8 py-6 border-2 rounded-full" asChild>
                <Link href="/algorithm">
                  <Brain className="mr-2 h-5 w-5 text-white" />
                  Explore Algorithm
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg bg-zinc-900 hover:bg-zinc-800 px-8 py-6" asChild>
                <Link href="/add-patient">
                  <Shield className="mr-2 h-5 w-5" />
                  Start Encrypting
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Algorithm Features */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Advanced Cryptographic Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Six revolutionary security layers working in harmony to protect your healthcare data.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-500/50">
              <CardHeader>
                <div className="w-12 h-12 border-2 border-white rounded-lg flex items-center justify-center mb-4">
                  <Atom className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Quantum-Inspired Encryption</CardTitle>
                <CardDescription>
                  4 quantum layers simulating superposition, entanglement, collapse, and coherence states
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>SUPERPOSITION - Amplitude transformations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>ENTANGLED - Position-based correlation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>COLLAPSED - Phase-shift transformations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>COHERENT - Amplitude-phase combination</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-500/50">
              <CardHeader>
                <div className="w-12 h-12 border-2 border-white rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Lattice Obfuscation</CardTitle>
                <CardDescription>
                  128-dimensional lattice transformations with QR decomposition for numerical stability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>High-dimensional mathematical obfuscation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Handles data of any length</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Quantum-resistant security</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-green-500/50">
              <CardHeader>
                <div className="w-12 h-12 border-2 border-white rounded-lg flex items-center justify-center mb-4">
                  <Dna className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Biological Key Evolution</CardTitle>
                <CardDescription>
                  DNA-inspired key generation with golden ratio growth and mutation patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>1000-element biological sequence</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>5% mutation rate for diversity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>1000 SHA256 iterations</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-orange-500/50">
              <CardHeader>
                <div className="w-12 h-12 border-2 border-white rounded-lg flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Temporal Privacy</CardTitle>
                <CardDescription>
                  Time-decay differential privacy with mathematical guarantees
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>ε=1.0, δ=1e-5 privacy budget</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Adaptive sensitivity scaling</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Time-based privacy decay</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-indigo-500/50">
              <CardHeader>
                <div className="w-12 h-12 border-2 border-white rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Homomorphic Operations</CardTitle>
                <CardDescription>
                  Encrypted domain computations with mathematical reversibility
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Compute on encrypted data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>XOR-based operations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Length-preserving transforms</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-teal-500/50">
              <CardHeader>
                <div className="w-12 h-12 border-2 border-white rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Blockchain Integrity</CardTitle>
                <CardDescription>
                  Tamper-proof verification with SHA256 hash chains
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Immutable audit trail</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Metadata protection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Comprehensive validation</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-20 px-6 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get Started with TDP-QIMLE
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the future of healthcare data security with our revolutionary encryption system.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/encrypt">
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 border-2 border-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-lg">Encrypt Data</CardTitle>
                  <CardDescription>
                    Apply TDP-QIMLE encryption with quantum layers
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/decrypt">
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 border-2 border-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Unlock className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-lg">Decrypt Data</CardTitle>
                  <CardDescription>
                    Secure access to encrypted patient records
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/add-patient">
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 border-2 border-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-lg">Add Patient</CardTitle>
                  <CardDescription>
                    Register new patients with secure encryption
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/analytics">
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 border-2 border-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-lg">Analytics</CardTitle>
                  <CardDescription>
                    Privacy-preserving data analysis and records
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Algorithm Stats */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Algorithm Specifications
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Technical parameters and performance metrics of the TDP-QIMLE algorithm.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r text-white bg-clip-text  mb-2">
                v3.0.0
              </div>
              <div className="text-sm text-gray-400">Algorithm Version</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r text-white bg-clip-text  mb-2">
                4
              </div>
              <div className="text-sm text-gray-400">Quantum Layers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r text-white bg-clip-text  mb-2">
                128-D
              </div>
              <div className="text-sm text-gray-400">Lattice Dimension</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r text-white bg-clip-text  mb-2">
                ε=1.0
              </div>
              <div className="text-sm text-gray-400">Privacy Budget</div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Display */}
      {/* <section className="py-20 px-6 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Patient Records</CardTitle>
                <CardDescription>
                  Encrypted patient data with TDP-QIMLE protection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PatientList />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Differential Privacy Results</CardTitle>
                <CardDescription>
                  Real-time privacy-preserving analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DPResult />
              </CardContent>
            </Card>
          </div>
        </div>
      </section> */}

      <div className='flex justify-center items-center'>
      <Button size="lg" className="text-2xl bg-zinc-900 hover:bg-zinc-800 text-white px-8 py-6 border-2 rounded-full mb-20" asChild>
                <Link href="/algorithm">
                  <Brain className="mr-2 h-5 w-5 text-white" />
                  Explore Algorithm
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
      </div>
    </div>
  )
}
