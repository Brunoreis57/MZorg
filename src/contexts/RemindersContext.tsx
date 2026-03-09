import React, { createContext, useContext, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type ReminderType = "recurso" | "documento" | "certidao" | "pregao" | "outro";

export interface Reminder {
  id: string;
  title: string;
  description: string;
  type: ReminderType;
  date: string;
  time: string;
  read: boolean;
  createdAt: string;
}

interface RemindersContextType {
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, "id" | "read" | "createdAt">) => void;
  removeReminder: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: number;
}

const RemindersContext = createContext<RemindersContextType | undefined>(undefined);

export function RemindersProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: dbReminders = [] } = useQuery({
    queryKey: ["reminders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .order("date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const reminders: Reminder[] = dbReminders.map((r: any) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    type: r.type as ReminderType,
    date: r.date,
    time: r.time || "",
    read: r.read,
    createdAt: r.created_at,
  }));

  const addMut = useMutation({
    mutationFn: async (data: Omit<Reminder, "id" | "read" | "createdAt">) => {
      const { error } = await supabase.from("reminders").insert({
        user_id: user!.id,
        title: data.title,
        description: data.description,
        type: data.type,
        date: data.date,
        time: data.time,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const addReminder = useCallback(
    (data: Omit<Reminder, "id" | "read" | "createdAt">) => {
      addMut.mutate(data);
    },
    [addMut]
  );

  const removeMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reminders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const removeReminder = useCallback((id: string) => {
    removeMut.mutate(id);
  }, [removeMut]);

  const markReadMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reminders").update({ read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const markAsRead = useCallback((id: string) => {
    markReadMut.mutate(id);
  }, [markReadMut]);

  const markAllMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("reminders")
        .update({ read: true })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const markAllAsRead = useCallback(() => {
    markAllMut.mutate();
  }, [markAllMut]);

  const unreadCount = reminders.filter((r) => !r.read).length;

  return (
    <RemindersContext.Provider
      value={{ reminders, addReminder, removeReminder, markAsRead, markAllAsRead, unreadCount }}
    >
      {children}
    </RemindersContext.Provider>
  );
}

export function useReminders() {
  const ctx = useContext(RemindersContext);
  if (!ctx) throw new Error("useReminders must be used within RemindersProvider");
  return ctx;
}
