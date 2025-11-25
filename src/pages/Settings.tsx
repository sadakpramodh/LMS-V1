import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Upload, User } from "lucide-react";
import {
  getStoredAlertSettings,
  getStoredProfile,
  updateStoredAlertSettings,
  updateStoredProfile,
} from "@/lib/localData";

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [profile, setProfile] = useState({
    full_name: "",
    avatar_url: "",
  });

  const [alertSettings, setAlertSettings] = useState({
    email_alerts: true,
    whatsapp_alerts: false,
    whatsapp_number: "",
  });

  const loadProfile = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      const stored = getStoredProfile(user.id);
      setProfile({
        full_name: stored?.full_name ?? user.full_name ?? "",
        avatar_url: stored?.avatar_url ?? "",
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to load profile";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  }, [toast, user?.full_name, user?.id]);

  const loadAlertSettings = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      const stored = getStoredAlertSettings(user.id);
      setAlertSettings({
        email_alerts: stored.email_alerts,
        whatsapp_alerts: stored.whatsapp_alerts,
        whatsapp_number: stored.whatsapp_number ?? "",
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load alert settings";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  }, [toast, user?.id]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    void loadProfile();
    void loadAlertSettings();
  }, [loadAlertSettings, loadProfile, user?.id]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      setProfile((previous) => ({ ...previous, avatar_url: dataUrl }));
      updateStoredProfile(user.id, {
        ...profile,
        avatar_url: dataUrl,
      });

      toast({
        title: "Success",
        description: "Avatar uploaded successfully",
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to upload avatar";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be signed in to update your profile.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      updateStoredProfile(user.id, profile);

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update profile";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAlertSettings = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be signed in to update alert settings.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      updateStoredAlertSettings(user.id, alertSettings);

      toast({
        title: "Success",
        description: "Alert settings updated successfully",
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update alert settings";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Settings</h1>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                <User className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
            <div>
              <Label htmlFor="avatar" className="cursor-pointer">
                <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading..." : "Change Avatar"}
                </div>
              </Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Max 5MB - JPG, PNG, WebP, GIF
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={profile.full_name}
              onChange={(e) =>
                setProfile({ ...profile, full_name: e.target.value })
              }
            />
          </div>

          <Button onClick={handleSaveProfile} disabled={loading}>
            {loading ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Alert Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="emailAlerts">Email Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="emailAlerts"
              checked={alertSettings.email_alerts}
              onCheckedChange={(checked) =>
                setAlertSettings({ ...alertSettings, email_alerts: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="whatsappAlerts">WhatsApp Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via WhatsApp
              </p>
            </div>
            <Switch
              id="whatsappAlerts"
              checked={alertSettings.whatsapp_alerts}
              onCheckedChange={(checked) =>
                setAlertSettings({ ...alertSettings, whatsapp_alerts: checked })
              }
            />
          </div>

          {alertSettings.whatsapp_alerts && (
            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
              <Input
                id="whatsappNumber"
                type="tel"
                placeholder="+1234567890"
                value={alertSettings.whatsapp_number}
                onChange={(e) =>
                  setAlertSettings({
                    ...alertSettings,
                    whatsapp_number: e.target.value,
                  })
                }
              />
            </div>
          )}

          <Button onClick={handleSaveAlertSettings} disabled={loading}>
            {loading ? "Saving..." : "Save Alert Settings"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
