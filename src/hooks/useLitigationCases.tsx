import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PostgrestError } from "@supabase/supabase-js";
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

  const fetchCases = useCallback(async () => {
    setLoading(true);
    let userId: string | null = null;

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      userId = user?.id ?? null;

      const { data, error } = await supabase
        .from("litigation_cases")
        .select("*")
        .order("created_at", { ascending: false })
        .returns<LitigationCase[]>();

      if (error) throw error;

      const localCases = userId ? getLocalLitigationCases(userId) : [];
      setCases(sortCases([...(data ?? []), ...localCases]));
    } catch (error: unknown) {
      console.error("Error fetching litigation cases:", error);

      if (userId) {
        const localCases = getLocalLitigationCases(userId);
        if (localCases.length > 0) {
          setCases(sortCases(localCases));
          toast.warning(
            "Showing locally saved litigation cases. Unable to sync with the server."
          );
          return;
        }
      }

      toast.error("Failed to load litigation cases");
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCase = async (id: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (id.startsWith("local-") && user) {
        removeLocalLitigationCase(user.id, id);
        setCases((previous) =>
          sortCases(previous.filter((item) => item.id !== id))
        );
        toast.success("Case deleted successfully");
        return;
      }

      const { error } = await supabase
        .from("litigation_cases")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Case deleted successfully");
      setCases((previous) => previous.filter((item) => item.id !== id));
    } catch (error: unknown) {
      console.error("Error deleting case:", error);
      toast.error("Failed to delete case");
    }
  };

  const bulkInsertCases = async (
    casesData: LitigationCaseInsert[]
  ) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error("Auth error:", authError);
        toast.error("Authentication error. Please log in again.");
        return;
      }

      if (!user) {
        toast.error("You must be logged in to upload cases");
        return;
      }

      console.log("User authenticated:", user.id);
      console.log("Cases to insert:", casesData);

      const casesWithUserId = casesData.map((caseData) => ({
        ...caseData,
        user_id: user.id,
      }));

      console.log("Cases with user_id:", casesWithUserId);

      const { data, error } = await supabase
        .from("litigation_cases")
        .insert(casesWithUserId)
        .select()
        .returns<LitigationCase[]>();

      if (error) {
        if (isPermissionError(error)) {
          const stored = handleLocalFallback(user.id, casesData);
          setCases((previous) => sortCases([...stored, ...previous]));
          return;
        }

        console.error("Insert error:", error);
        throw error;
      }

      console.log("Insert successful:", data);
      toast.success(`Successfully imported ${casesData.length} cases`);
      void fetchCases();
    } catch (error: unknown) {
      console.error("Error bulk inserting cases:", error);
      const message =
        error instanceof Error ? error.message : "Failed to import cases";
      toast.error(message);
    }
  };

  useEffect(() => {
    void fetchCases();

    const channel = supabase
      .channel("litigation_cases_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "litigation_cases",
        },
        () => {
          void fetchCases();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchCases]);

  return {
    cases,
    loading,
    fetchCases,
    deleteCase,
    bulkInsertCases,
  };
};

const isPermissionError = (error: unknown): error is PostgrestError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as PostgrestError).code === "42501"
  );
};

const sortCases = (items: LitigationCase[]): LitigationCase[] => {
  return [...items].sort((a, b) => {
    const first = new Date(a.created_at).getTime();
    const second = new Date(b.created_at).getTime();
    return second - first;
  });
};

const handleLocalFallback = (
  userId: string,
  casesData: LitigationCaseInsert[]
) => {
  const stored = addLocalLitigationCases(userId, casesData);
  toast.success(
    `Stored ${stored.length} cases locally. They will remain available on this device until permissions are updated.`
  );
  return stored;
};
