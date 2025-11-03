import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (profile && !profile.is_enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/10 px-4">
        <Card className="max-w-md text-center shadow-[var(--shadow-card)]">
          <CardHeader className="flex flex-col items-center gap-3">
            <ShieldAlert className="h-12 w-12 text-amber-500" />
            <CardTitle className="text-2xl font-semibold text-foreground">
              Awaiting Admin Approval
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Your account has been created, but an administrator needs to enable access
              before you can start using the application.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button variant="outline" onClick={() => void refreshProfile()}>
                Check again
              </Button>
              <Button onClick={() => void signOut()}>Sign out</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
