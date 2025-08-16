import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { 
  SupermarketIncident, 
  SupermarketIncidentSummary, 
  AdminDashboardStats 
} from '@/types/incident';
import { databaseService } from '@/services/databaseService';
import { AlertCircle, CheckCircle, Clock, TrendingUp, MapPin, LogOut } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats | null>(null);
  const [recentIncidents, setRecentIncidents] = useState<Array<SupermarketIncident & { supermarket_name: string; chain: string }>>([]);
  const [incidentSummaries, setIncidentSummaries] = useState<SupermarketIncidentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIncidents, setSelectedIncidents] = useState<string[]>([]);
  const [bulkResolveNote, setBulkResolveNote] = useState('');

  useEffect(() => {
    // Check initial auth state
    checkAuthState();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
        loadAdminData();
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthState = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setIsAuthenticated(true);
      loadAdminData();
    } else {
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check admin status first
      const adminStatus = await databaseService.isCurrentUserAdmin();
      setIsAdmin(adminStatus);

      if (!adminStatus) {
        return;
      }

      // Load dashboard data in parallel
      const [stats, incidents, summaries] = await Promise.all([
        databaseService.getAdminDashboardStats(),
        databaseService.getRecentIncidents(20, undefined),
        databaseService.getIncidentSummaries()
      ]);

      setDashboardStats(stats);
      setRecentIncidents(incidents);
      setIncidentSummaries(summaries.filter(s => s.active_incidents > 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const updateIncidentStatus = async (incidentId: string, status: SupermarketIncident['status']) => {
    try {
      await databaseService.updateIncident(incidentId, { status });
      await loadAdminData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update incident');
    }
  };

  const bulkResolveSelected = async () => {
    if (selectedIncidents.length === 0) return;

    try {
      const resolvedCount = await databaseService.bulkResolveIncidents(
        selectedIncidents, 
        bulkResolveNote || undefined
      );
      
      setSelectedIncidents([]);
      setBulkResolveNote('');
      await loadAdminData();
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve incidents');
    }
  };

  const getStatusBadge = (status: SupermarketIncident['status']) => {
    const variants = {
      open: 'destructive',
      investigating: 'default',
      resolved: 'secondary',
      closed: 'outline'
    } as const;

    return (
      <Badge variant={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: SupermarketIncident['priority']) => {
    const variants = {
      low: 'outline',
      medium: 'secondary', 
      high: 'default',
      urgent: 'destructive'
    } as const;

    return (
      <Badge variant={variants[priority]}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Show login form if not authenticated
  if (isAuthenticated === false) {
    return (
      <div className="container mx-auto p-6 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>
              Please sign in with your admin credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Auth 
              supabaseClient={supabase}
              appearance={{ 
                theme: ThemeSupa,
                style: {
                  input: { color: 'black' },
                  label: { color: 'black' }
                }
              }}
              providers={[]}
              redirectTo={`${window.location.origin}/admin`}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Access denied. Admin privileges required to view this dashboard.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={loadAdminData} variant="outline">
            Refresh Data
          </Button>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Dashboard Stats */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Supermarkets</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.total_supermarkets}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{dashboardStats.active_incidents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved Incidents</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{dashboardStats.resolved_incidents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.total_incidents}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="incidents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="incidents">Recent Incidents</TabsTrigger>
          <TabsTrigger value="summaries">Supermarket Status</TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="space-y-4">
          {/* Bulk Actions */}
          {selectedIncidents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Bulk Actions ({selectedIncidents.length} selected)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Add admin note (optional)..."
                  value={bulkResolveNote}
                  onChange={(e) => setBulkResolveNote(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={bulkResolveSelected} variant="default">
                    Resolve Selected
                  </Button>
                  <Button 
                    onClick={() => setSelectedIncidents([])} 
                    variant="outline"
                  >
                    Clear Selection
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Incidents */}
          <div className="space-y-4">
            {recentIncidents.map((incident) => (
              <Card key={incident.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedIncidents.includes(incident.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIncidents(prev => [...prev, incident.id]);
                            } else {
                              setSelectedIncidents(prev => prev.filter(id => id !== incident.id));
                            }
                          }}
                          className="rounded"
                        />
                        <CardTitle className="text-lg">
                          {incident.supermarket_name} ({incident.chain})
                        </CardTitle>
                      </div>
                      <CardDescription>
                        {incident.incident_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        {' • '}
                        {new Date(incident.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(incident.status)}
                      {getPriorityBadge(incident.priority)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {incident.description && (
                    <p className="text-sm text-muted-foreground">{incident.description}</p>
                  )}
                  
                  {incident.reporter_name && (
                    <p className="text-sm">
                      <strong>Reporter:</strong> {incident.reporter_name}
                      {incident.reporter_email && ` (${incident.reporter_email})`}
                    </p>
                  )}

                  {incident.admin_notes && (
                    <div className="bg-muted p-3 rounded">
                      <p className="text-sm font-medium mb-1">Admin Notes:</p>
                      <p className="text-sm">{incident.admin_notes}</p>
                    </div>
                  )}

                  {incident.status !== 'resolved' && (
                    <div className="flex gap-2">
                      <Select 
                        onValueChange={(value) => updateIncidentStatus(incident.id, value as SupermarketIncident['status'])}
                        defaultValue={incident.status}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="investigating">Investigating</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="summaries" className="space-y-4">
          {incidentSummaries.map((summary) => (
            <Card key={summary.supermarket_id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{summary.supermarket_name}</CardTitle>
                    <CardDescription>
                      {summary.chain} • {summary.city}
                    </CardDescription>
                  </div>
                  <Badge variant="destructive">
                    {summary.active_incidents} active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {summary.active_incident_types && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Issues:</strong> {summary.active_incident_types}
                  </p>
                )}
                {summary.last_incident_date && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong>Last reported:</strong> {new Date(summary.last_incident_date).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}

          {incidentSummaries.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium">No Active Incidents</p>
                <p className="text-muted-foreground">All supermarkets are running smoothly!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
