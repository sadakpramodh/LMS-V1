import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import {
  getLocalDisputes,
  removeLocalDispute,
  updateLocalDisputeStatus,
} from "@/lib/localData";

export type Dispute = {
  id: string;
  user_id: string;
  company: string;
  dispute_type: string;
  value: number;
  notice_from: string;
  notice_date: string;
  reply_due_date: string;
  responsible_user: string;
  description: string | null;
  status: string;
  document_paths: string[] | null;
  created_at: string;
  updated_at: string;
};

export function useDisputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDisputes = useCallback(async () => {
    if (!user) {
      setDisputes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const localDisputes = getLocalDisputes(user.id);
      setDisputes(localDisputes);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch disputes";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  const deleteDispute = async (id: string) => {
    try {
      if (!user?.id) return;

      const updated = removeLocalDispute(user.id, id);
      setDisputes(updated);
      toast({
        title: "Dispute Deleted",
        description: "The dispute has been deleted successfully.",
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to delete dispute";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const updateDisputeStatus = async (id: string, status: string) => {
    try {
      if (!user?.id) return;

      const updated = updateLocalDisputeStatus(user.id, id, status);
      setDisputes(updated);
      toast({
        title: "Status Updated",
        description: "The dispute status has been updated successfully.",
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update status";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setDisputes([]);
      setLoading(false);
      return;
    }

    void fetchDisputes();

    const handleDisputeCreated = () => {
      void fetchDisputes();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("disputeCreated", handleDisputeCreated);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("disputeCreated", handleDisputeCreated);
      }
    };
  }, [fetchDisputes, user?.id]);

  return {
    disputes,
    loading,
    fetchDisputes,
    deleteDispute,
    updateDisputeStatus,
  };
}
