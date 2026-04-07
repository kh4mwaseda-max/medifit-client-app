export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          pin: string;
          trainer_id: string;
          goal: string | null;
          start_date: string;
          line_user_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["clients"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
      };
      line_parse_logs: {
        Row: {
          id: string;
          client_id: string;
          line_message_id: string;
          app_type: "asken" | "kintore" | "unknown";
          raw_json: Record<string, unknown> | null;
          status: "success" | "failed";
          error_message: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["line_parse_logs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["line_parse_logs"]["Insert"]>;
      };
      body_records: {
        Row: {
          id: string;
          client_id: string;
          recorded_at: string;
          weight_kg: number | null;
          body_fat_pct: number | null;
          muscle_mass_kg: number | null;
          systolic_bp: number | null;
          diastolic_bp: number | null;
          resting_heart_rate: number | null;
          sleep_hours: number | null;
          sleep_quality: number | null;
          condition_score: number | null;
          water_ml: number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["body_records"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["body_records"]["Insert"]>;
      };
      training_sessions: {
        Row: {
          id: string;
          client_id: string;
          session_date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["training_sessions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["training_sessions"]["Insert"]>;
      };
      training_sets: {
        Row: {
          id: string;
          session_id: string;
          exercise_name: string;
          muscle_group: string | null;
          weight_kg: number | null;
          reps: number | null;
          set_number: number;
          rpe: number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["training_sets"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["training_sets"]["Insert"]>;
      };
      meal_records: {
        Row: {
          id: string;
          client_id: string;
          meal_date: string;
          meal_type: "breakfast" | "lunch" | "dinner" | "snack";
          food_name: string;
          calories: number | null;
          protein_g: number | null;
          fat_g: number | null;
          carbs_g: number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["meal_records"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["meal_records"]["Insert"]>;
      };
      body_photos: {
        Row: {
          id: string;
          client_id: string;
          photo_date: string;
          pose: "front" | "back" | "side";
          storage_path: string;
          weight_kg: number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["body_photos"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["body_photos"]["Insert"]>;
      };
      assessments: {
        Row: {
          id: string;
          client_id: string;
          generated_at: string;
          published_at: string | null;
          current_summary: string;
          prediction_1m: string;
          prediction_3m: string;
          risk_obesity: "low" | "medium" | "high";
          risk_musculoskeletal: "low" | "medium" | "high";
          risk_nutrition: "low" | "medium" | "high";
          risk_sleep: "low" | "medium" | "high";
          action_plan: string;
          trainer_notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["assessments"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["assessments"]["Insert"]>;
      };
    };
  };
};
