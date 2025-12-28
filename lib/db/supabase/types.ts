export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number;
          color: string | null;
          created_at: string;
          currency: string;
          icon: string | null;
          id: string;
          is_archived: boolean;
          name: string;
          type: Database["public"]["Enums"]["account_type"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          balance?: number;
          color?: string | null;
          created_at?: string;
          currency?: string;
          icon?: string | null;
          id?: string;
          is_archived?: boolean;
          name: string;
          type?: Database["public"]["Enums"]["account_type"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          balance?: number;
          color?: string | null;
          created_at?: string;
          currency?: string;
          icon?: string | null;
          id?: string;
          is_archived?: boolean;
          name?: string;
          type?: Database["public"]["Enums"]["account_type"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      budget_members: {
        Row: {
          budget_id: string;
          id: string;
          invited_by: string | null;
          joined_at: string;
          role: Database["public"]["Enums"]["member_role"];
          user_id: string;
        };
        Insert: {
          budget_id: string;
          id?: string;
          invited_by?: string | null;
          joined_at?: string;
          role?: Database["public"]["Enums"]["member_role"];
          user_id: string;
        };
        Update: {
          budget_id?: string;
          id?: string;
          invited_by?: string | null;
          joined_at?: string;
          role?: Database["public"]["Enums"]["member_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budget_members_budget_id_fkey";
            columns: ["budget_id"];
            isOneToOne: false;
            referencedRelation: "budgets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budget_members_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budget_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      budgets: {
        Row: {
          amount: number;
          category_id: string | null;
          created_at: string;
          currency: string;
          id: string;
          is_active: boolean;
          name: string;
          period: Database["public"]["Enums"]["budget_period"];
          start_date: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          category_id?: string | null;
          created_at?: string;
          currency?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          period?: Database["public"]["Enums"]["budget_period"];
          start_date?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          category_id?: string | null;
          created_at?: string;
          currency?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          period?: Database["public"]["Enums"]["budget_period"];
          start_date?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budgets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          color: string | null;
          created_at: string;
          icon: string | null;
          id: string;
          is_archived: boolean;
          is_system: boolean;
          name: string;
          parent_id: string | null;
          sort_order: number;
          type: Database["public"]["Enums"]["category_type"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          icon?: string | null;
          id?: string;
          is_archived?: boolean;
          is_system?: boolean;
          name: string;
          parent_id?: string | null;
          sort_order?: number;
          type: Database["public"]["Enums"]["category_type"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          icon?: string | null;
          id?: string;
          is_archived?: boolean;
          is_system?: boolean;
          name?: string;
          parent_id?: string | null;
          sort_order?: number;
          type?: Database["public"]["Enums"]["category_type"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "categories_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          default_currency: string;
          display_name: string | null;
          email: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          default_currency?: string;
          display_name?: string | null;
          email: string;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          default_currency?: string;
          display_name?: string | null;
          email?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          account_id: string;
          amount: number;
          category_id: string | null;
          created_at: string;
          currency: string;
          date: string;
          description: string | null;
          exchange_rate: number | null;
          id: string;
          to_account_id: string | null;
          type: Database["public"]["Enums"]["transaction_type"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_id: string;
          amount: number;
          category_id?: string | null;
          created_at?: string;
          currency: string;
          date?: string;
          description?: string | null;
          exchange_rate?: number | null;
          id?: string;
          to_account_id?: string | null;
          type: Database["public"]["Enums"]["transaction_type"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_id?: string;
          amount?: number;
          category_id?: string | null;
          created_at?: string;
          currency?: string;
          date?: string;
          description?: string | null;
          exchange_rate?: number | null;
          id?: string;
          to_account_id?: string | null;
          type?: Database["public"]["Enums"]["transaction_type"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_to_account_id_fkey";
            columns: ["to_account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      transaction_items: {
        Row: {
          id: string;
          transaction_id: string;
          category_id: string | null;
          amount: number;
          description: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          category_id?: string | null;
          amount: number;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          transaction_id?: string;
          category_id?: string | null;
          amount?: number;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transaction_items_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transaction_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      account_type:
        | "cash"
        | "card"
        | "bank"
        | "savings"
        | "investment"
        | "other";
      budget_period: "weekly" | "monthly" | "yearly";
      category_type: "income" | "expense";
      member_role: "owner" | "editor" | "viewer";
      transaction_type: "income" | "expense" | "transfer";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Удобные алиасы для типов таблиц
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Account = Database["public"]["Tables"]["accounts"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type Budget = Database["public"]["Tables"]["budgets"]["Row"];
export type BudgetMember =
  Database["public"]["Tables"]["budget_members"]["Row"];
export type TransactionItem =
  Database["public"]["Tables"]["transaction_items"]["Row"];

// Типы для вставки
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type AccountInsert = Database["public"]["Tables"]["accounts"]["Insert"];
export type CategoryInsert =
  Database["public"]["Tables"]["categories"]["Insert"];
export type TransactionInsert =
  Database["public"]["Tables"]["transactions"]["Insert"];
export type BudgetInsert = Database["public"]["Tables"]["budgets"]["Insert"];
export type TransactionItemInsert =
  Database["public"]["Tables"]["transaction_items"]["Insert"];

// Типы для обновления
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type AccountUpdate = Database["public"]["Tables"]["accounts"]["Update"];
export type CategoryUpdate =
  Database["public"]["Tables"]["categories"]["Update"];
export type TransactionUpdate =
  Database["public"]["Tables"]["transactions"]["Update"];
export type BudgetUpdate = Database["public"]["Tables"]["budgets"]["Update"];
export type TransactionItemUpdate =
  Database["public"]["Tables"]["transaction_items"]["Update"];

// Enums
export type AccountType = Database["public"]["Enums"]["account_type"];
export type CategoryType = Database["public"]["Enums"]["category_type"];
export type TransactionType = Database["public"]["Enums"]["transaction_type"];
export type BudgetPeriod = Database["public"]["Enums"]["budget_period"];
export type MemberRole = Database["public"]["Enums"]["member_role"];
