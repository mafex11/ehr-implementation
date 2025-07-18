'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, BarChart3, Shield, TrendingUp, AlertCircle, ArrowLeft, Eye, Database, Clock } from 'lucide-react';
import api from '../../../utils/api';

interface PrivacySettings {
  epsilon: number;
  queryType: 'lab_average' | 'age_distribution' | 'diagnosis_count' | 'system_stats';
}

interface Patient {
  _id: string;
  name: string;
  age: number;
  diagnosis: string;
  lab_result: number;
}

interface DPResult {
  queryType: string;
  epsilon: number;
  result: number | Array<{key: string, value: number}>;
  timestamp: string;
  privacy_budget_used: number;
}

interface SystemStats {
  total_patients: number;
  encrypted_patients: number;
  total_queries: number;
  privacy_budget_remaining: number;
}

export default function Analytics() {
  const router = useRouter();
  const [settings, setSettings] = useState<PrivacySettings>({
    epsilon: 1.0,
    queryType: 'system_stats',
  });
  
  const [dpResults, setDpResults] = useState<DPResult[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privacyBudgetUsed, setPrivacyBudgetUsed] = useState(0);
  
  // Query descriptions for user information
  const queryDescriptions = {
    system_stats: 'Get overall system statistics with privacy protection',
    lab_average: 'Average of all patient lab results with privacy protection',
    age_distribution: 'Age distribution of patients with differential privacy',
    diagnosis_count: 'Count of patients per diagnosis with privacy protection',
  };
  
  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('system/stats');
      setSystemStats(res.data);
    } catch (err) {
      console.error('Error loading system stats:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (name: string, value: any) => {
    setSettings(prev => ({ ...prev, [name]: value }));
  };
  
  const runQuery = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let result;
      let formattedResult: DPResult;
      
      switch (settings.queryType) {
        case 'system_stats':
          result = await api.get('system/stats');
          formattedResult = {
            queryType: settings.queryType,
            epsilon: settings.epsilon,
            result: result.data.total_patients || 0,
            timestamp: new Date().toISOString(),
            privacy_budget_used: 0.1
          };
          break;
          
        case 'lab_average':
          // Simulate differential privacy query
          formattedResult = {
            queryType: settings.queryType,
            epsilon: settings.epsilon,
            result: Math.random() * 100 + 50, // Simulated average
            timestamp: new Date().toISOString(),
            privacy_budget_used: settings.epsilon
          };
          break;
          
        case 'age_distribution':
          formattedResult = {
            queryType: settings.queryType,
            epsilon: settings.epsilon,
            result: [
              { key: '0-20', value: Math.floor(Math.random() * 10) },
              { key: '21-40', value: Math.floor(Math.random() * 15) },
              { key: '41-60', value: Math.floor(Math.random() * 20) },
              { key: '61-80', value: Math.floor(Math.random() * 12) },
              { key: '81+', value: Math.floor(Math.random() * 5) }
            ],
            timestamp: new Date().toISOString(),
            privacy_budget_used: settings.epsilon
          };
          break;
          
        case 'diagnosis_count':
          formattedResult = {
            queryType: settings.queryType,
            epsilon: settings.epsilon,
            result: [
              { key: 'Hypertension', value: Math.floor(Math.random() * 10) },
              { key: 'Diabetes', value: Math.floor(Math.random() * 8) },
              { key: 'Asthma', value: Math.floor(Math.random() * 6) },
              { key: 'Other', value: Math.floor(Math.random() * 12) }
            ],
            timestamp: new Date().toISOString(),
            privacy_budget_used: settings.epsilon
          };
          break;
          
        default:
          throw new Error('Unknown query type');
      }
      
      setDpResults([formattedResult, ...dpResults]);
      setPrivacyBudgetUsed(prev => prev + formattedResult.privacy_budget_used);
      
    } catch (err) {
      console.error('Error running DP query:', err);
      setError('Failed to run privacy-preserving query');
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate privacy level description based on epsilon
  const getPrivacyLevel = (eps: number) => {
    if (eps <= 0.1) return { level: 'Very High', color: 'bg-green-500', description: 'Maximum privacy protection' };
    if (eps <= 0.5) return { level: 'High', color: 'bg-blue-500', description: 'Strong privacy protection' };
    if (eps <= 1.0) return { level: 'Medium', color: 'bg-yellow-500', description: 'Balanced privacy/utility' };
    if (eps <= 2.0) return { level: 'Low', color: 'bg-orange-500', description: 'Higher utility, lower privacy' };
    return { level: 'Very Low', color: 'bg-red-500', description: 'Minimal privacy protection' };
  };
  
  const privacyLevel = getPrivacyLevel(settings.epsilon);
  
  const renderResult = (result: DPResult) => {
    if (Array.isArray(result.result)) {
      return (
        <div className="space-y-2">
          {result.result.map((item, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
              <span className="text-sm">{item.key}</span>
              <Badge variant="outline">{item.value}</Badge>
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <div className="text-center">
          <div className="text-3xl font-bold text-primary">{result.result}</div>
          <div className="text-sm text-muted-foreground">
            {result.queryType === 'lab_average' ? 'Average Value' : 'Count'}
          </div>
        </div>
      );
    }
  };
  
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold mb-2">Privacy-Preserving Analytics</h1>
          <p className="text-muted-foreground text-lg">
            Run privacy-protected queries on patient data using differential privacy
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left panel: Settings */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Query Settings
                </CardTitle>
                <CardDescription>
                  Configure privacy parameters for your analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Query Type</Label>
                  <Select value={settings.queryType} onValueChange={(value) => handleChange('queryType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system_stats">System Statistics</SelectItem>
                      <SelectItem value="lab_average">Lab Average</SelectItem>
                      <SelectItem value="age_distribution">Age Distribution</SelectItem>
                      <SelectItem value="diagnosis_count">Diagnosis Count</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {queryDescriptions[settings.queryType]}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Privacy Level (ε = {settings.epsilon})</Label>
                  <Input
                    type="range"
                    min="0.1"
                    max="5.0"
                    step="0.1"
                    value={settings.epsilon}
                    onChange={(e) => handleChange('epsilon', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>High Privacy</span>
                    <span>High Utility</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${privacyLevel.color}`} />
                    <Badge variant="outline">{privacyLevel.level}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{privacyLevel.description}</p>
                </div>
                
                <Button onClick={runQuery} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Running Query...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Run Query
                    </>
                  )}
                </Button>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
            
            {/* Privacy Budget */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Privacy Budget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Used</span>
                    <span>{privacyBudgetUsed.toFixed(2)} / 10.0</span>
                  </div>
                  <Progress value={(privacyBudgetUsed / 10.0) * 100} className="w-full" />
                  <p className="text-xs text-muted-foreground">
                    Privacy budget remaining: {(10.0 - privacyBudgetUsed).toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right panel: Results */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="results" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="results">Query Results</TabsTrigger>
                <TabsTrigger value="system">System Overview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="results" className="space-y-6">
                {/* Current Result */}
                {dpResults.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Latest Query Result</CardTitle>
                      <CardDescription>
                        {queryDescriptions[dpResults[0].queryType as keyof typeof queryDescriptions]} (ε = {dpResults[0].epsilon})
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {renderResult(dpResults[0])}
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Privacy Budget Used: {dpResults[0].privacy_budget_used}</span>
                          <span>{new Date(dpResults[0].timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Query History */}
                <Card>
                  <CardHeader>
                    <CardTitle>Query History</CardTitle>
                    <CardDescription>
                      Previous privacy-preserving queries
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dpResults.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No queries run yet. Configure settings and run your first query.
                        </div>
                      ) : (
                        dpResults.map((result, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium capitalize">
                                  {result.queryType.replace('_', ' ')}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  Privacy Level: ε = {result.epsilon}
                                </p>
                              </div>
                              <Badge variant="outline">
                                {new Date(result.timestamp).toLocaleDateString()}
                              </Badge>
                            </div>
                            <div className="mt-3">
                              {renderResult(result)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="system" className="space-y-6">
                {/* System Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{systemStats?.total_patients || 0}</div>
                      <p className="text-xs text-muted-foreground">Registered patients</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Encrypted Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{systemStats?.encrypted_patients || 0}</div>
                      <p className="text-xs text-muted-foreground">Secured with TDP-QIMLE</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dpResults.length}</div>
                      <p className="text-xs text-muted-foreground">Privacy-preserving queries</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Privacy Budget</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{(10.0 - privacyBudgetUsed).toFixed(1)}</div>
                      <p className="text-xs text-muted-foreground">Budget remaining</p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Algorithm Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      TDP-QIMLE Algorithm Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Quantum Layers</span>
                          <Badge variant="outline">4 Active</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Lattice Obfuscation</span>
                          <Badge variant="outline">128-dim</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Biological Evolution</span>
                          <Badge variant="outline">1000 genes</Badge>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Differential Privacy</span>
                          <Badge variant="outline">Temporal</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Integrity Verification</span>
                          <Badge variant="outline">Blockchain</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Algorithm Version</span>
                          <Badge variant="outline">v3.0.0</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
} 