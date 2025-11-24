import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "./useAuth";
import {
  addLocalLitigationCases,
  getLocalLitigationCases,
  removeLocalLitigationCase,
} from "@/lib/litigationLocalStorage";

export interface LitigationCase {
  id: string;
  user_id: string;
  sr_no: number | null;
  parties: string;
  forum: string;
  particular: string | null;
  start_date: string | null;
  last_hearing_date: string | null;
  next_hearing_date: string | null;
  amount_involved: number | null;
  treatment_resolution: string | null;
  remarks: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export type LitigationCaseInsert = Omit<
  LitigationCase,
  "id" | "user_id" | "created_at" | "updated_at"
>;

export const useLitigationCases = () => {
  const [cases, setCases] = useState<LitigationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCases = useCallback(async () => {
    setLoading(true);

    try {
      if (!user?.id) {
        setCases([]);
        return;
      }

      const localCases = getLocalLitigationCases(user.id);
      setCases(sortCases(localCases));
    } catch (error: unknown) {
      console.error("Error fetching litigation cases:", error);
      toast.error("Failed to load litigation cases");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const deleteCase = async (id: string) => {
    try {
      if (!user?.id) {
        toast.error("Please sign in to manage cases");
        return;
      }

      const remaining = removeLocalLitigationCase(user.id, id);
      setCases(sortCases(remaining));
      toast.success("Case deleted successfully");
    } catch (error: unknown) {
      console.error("Error deleting case:", error);
      toast.error("Failed to delete case");
    }
  };

  const bulkInsertCases = async (
    casesData: LitigationCaseInsert[]
  ) => {
    try {
      if (!user?.id) {
        toast.error("You must be logged in to upload cases");
        return;
      }

      const stored = addLocalLitigationCases(user.id, casesData);
      setCases((previous) => sortCases([...stored, ...previous]));
      toast.success(`Saved ${casesData.length} cases locally`);
    } catch (error: unknown) {
      console.error("Error bulk inserting cases:", error);
      const message =
        error instanceof Error ? error.message : "Failed to import cases";
      toast.error(message);
    }
  };

  useEffect(() => {
    void fetchCases();
  }, [fetchCases]);

  return {
    cases,
    loading,
    fetchCases,
    deleteCase,
    bulkInsertCases,
  };
};

const sortCases = (items: LitigationCase[]): LitigationCase[] => {
  return [...items].sort((a, b) => {
    const first = new Date(a.created_at).getTime();
    const second = new Date(b.created_at).getTime();
    return second - first;
  });
};
