
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "answers": {
                  Row: {
                    "answer": string,"couple_id": string,"created_at": string,"question_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "answer": string,"couple_id": string,"created_at"?: string,"question_id": string,"user_id": string
                  }
                  Update: {
                    "answer"?: string,"couple_id"?: string,"created_at"?: string,"question_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "answers_couple_id_fkey"
      columns: ["couple_id"]
isOneToOne: false
      referencedRelation: "couples"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "answers_question_id_fkey"
      columns: ["question_id"]
isOneToOne: false
      referencedRelation: "questions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "answers_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"couples": {
                  Row: {
                    "created_at": string,"id": string,"invite_code": string | null,"together_since": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"invite_code"?: string | null,"together_since"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"invite_code"?: string | null,"together_since"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"journal_entries": {
                  Row: {
                    "body": string,"couple_id": string,"created_at": string,"id": string,"image_path": string | null,"kind": Database["public"]['Enums']["journal_kind"],"title": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"couple_id": string,"created_at"?: string,"id"?: string,"image_path"?: string | null,"kind": Database["public"]['Enums']["journal_kind"],"title"?: string | null,"user_id": string
                  }
                  Update: {
                    "body"?: string,"couple_id"?: string,"created_at"?: string,"id"?: string,"image_path"?: string | null,"kind"?: Database["public"]['Enums']["journal_kind"],"title"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "journal_entries_couple_id_fkey"
      columns: ["couple_id"]
isOneToOne: false
      referencedRelation: "couples"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "journal_entries_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "couple_id": string | null,"created_at": string,"display_name": string | null,"id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "couple_id"?: string | null,"created_at"?: string,"display_name"?: string | null,"id": string,"updated_at"?: string
                  }
                  Update: {
                    "couple_id"?: string | null,"created_at"?: string,"display_name"?: string | null,"id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_couple_id_fkey"
      columns: ["couple_id"]
isOneToOne: false
      referencedRelation: "couples"
      referencedColumns: ["id"]
    }
                  ]
                },"questions": {
                  Row: {
                    "category_id": string,"id": string,"is_active": boolean,"options": Json | null,"scale_labels": Json | null,"scale_max": number | null,"scale_min": number | null,"sort_order": number,"text": string,"type": Database["public"]['Enums']["question_type"]
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id": string,"id"?: string,"is_active"?: boolean,"options"?: Json | null,"scale_labels"?: Json | null,"scale_max"?: number | null,"scale_min"?: number | null,"sort_order"?: number,"text": string,"type": Database["public"]['Enums']["question_type"]
                  }
                  Update: {
                    "category_id"?: string,"id"?: string,"is_active"?: boolean,"options"?: Json | null,"scale_labels"?: Json | null,"scale_max"?: number | null,"scale_min"?: number | null,"sort_order"?: number,"text"?: string,"type"?: Database["public"]['Enums']["question_type"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "questions_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "quiz_categories"
      referencedColumns: ["id"]
    }
                  ]
                },"quiz_categories": {
                  Row: {
                    "color": string,"description": string,"icon": string,"id": string,"name": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "color": string,"description": string,"icon": string,"id"?: string,"name": string,"sort_order"?: number
                  }
                  Update: {
                    "color"?: string,"description"?: string,"icon"?: string,"id"?: string,"name"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"swipe_items": {
                  Row: {
                    "description": string,"icon": string,"id": string,"image_url": string | null,"kind": Database["public"]['Enums']["swipe_kind"],"sort_order": number,"tags": (string)[],"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "description": string,"icon": string,"id"?: string,"image_url"?: string | null,"kind": Database["public"]['Enums']["swipe_kind"],"sort_order"?: number,"tags"?: (string)[],"title": string
                  }
                  Update: {
                    "description"?: string,"icon"?: string,"id"?: string,"image_url"?: string | null,"kind"?: Database["public"]['Enums']["swipe_kind"],"sort_order"?: number,"tags"?: (string)[],"title"?: string
                  }
                  Relationships: [
                    
                  ]
                },"swipes": {
                  Row: {
                    "couple_id": string,"created_at": string,"item_id": string,"liked": boolean,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "couple_id": string,"created_at"?: string,"item_id": string,"liked": boolean,"user_id": string
                  }
                  Update: {
                    "couple_id"?: string,"created_at"?: string,"item_id"?: string,"liked"?: boolean,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "swipes_couple_id_fkey"
      columns: ["couple_id"]
isOneToOne: false
      referencedRelation: "couples"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "swipes_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "swipe_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "swipes_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "compare_category":
{ Args: { "p_category_id": string }; Returns: {
              "mine": string,"partner": string,"question_id": string
            }[]
                           },
"create_invite":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"delete_account":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"join_couple":
{ Args: { "code": string }; Returns: string
                           },
"leave_couple":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"quiz_progress":
{ Args: Record<PropertyKey, never>; Returns: {
              "category_id": string,"mine": number,"partner": number,"total": number
            }[]
                           },
"swipe":
{ Args: { "p_item_id": string,"p_liked": boolean }; Returns: boolean
                           },
"swipe_matches":
{ Args: Record<PropertyKey, never>; Returns: {
              "description": string,
"icon": string,
"id": string,
"image_url": string | null,
"kind": Database["public"]['Enums']["swipe_kind"],
"sort_order": number,
"tags": (string)[],
"title": string
            }[]
                          SetofOptions: {
        from: "*"
        to: "swipe_items"
        isOneToOne: false
        isSetofReturn: true
      } }
          }
          Enums: {
            "journal_kind": "note"|"memory"|"spark","question_type": "multiple_choice"|"scale"|"text"|"yes_no","swipe_kind": "movie"|"date"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "journal_kind": ["note", "memory", "spark"],"question_type": ["multiple_choice", "scale", "text", "yes_no"],"swipe_kind": ["movie", "date"]
          }
        }
} as const
