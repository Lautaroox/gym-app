export type Database = {
  public: {
    Tables: {
      alumnos: {
        Row: {
          id: string;
          created_at: string;
          nombre: string;
          Fecha_vencimiento: string;
          cuota_al_dia: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          nombre: string;
          Fecha_vencimiento: string;
          cuota_al_dia: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          nombre?: string;
          Fecha_vencimiento?: string;
          cuota_al_dia?: boolean;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
