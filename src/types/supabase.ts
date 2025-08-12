export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number | null
          coa_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          balance?: number | null
          coa_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          balance?: number | null
          coa_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      actions: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      airport_handling: {
        Row: {
          base_price: number
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          location: string
          sales_fee: number
          selling_price: number
          service_name: string
          service_type: string
          updated_at: string | null
        }
        Insert: {
          base_price?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          location: string
          sales_fee?: number
          selling_price?: number
          service_name: string
          service_type: string
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          location?: string
          sales_fee?: number
          selling_price?: number
          service_name?: string
          service_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      airport_handling_services: {
        Row: {
          additional: number
          additional_basic_price: number
          airport: string | null
          basic_price: number
          category: string
          created_at: string | null
          id: number
          sell_price: number
          service_type: string
          services_arrival: string
          services_departure: string
          terminal: string
          trip_type: string
          updated_at: string | null
        }
        Insert: {
          additional: number
          additional_basic_price?: number
          airport?: string | null
          basic_price: number
          category: string
          created_at?: string | null
          id?: number
          sell_price: number
          service_type: string
          services_arrival: string
          services_departure: string
          terminal: string
          trip_type: string
          updated_at?: string | null
        }
        Update: {
          additional?: number
          additional_basic_price?: number
          airport?: string | null
          basic_price?: number
          category?: string
          created_at?: string | null
          id?: number
          sell_price?: number
          service_type?: string
          services_arrival?: string
          services_departure?: string
          terminal?: string
          trip_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      airport_transfer: {
        Row: {
          airport_location: string | null
          booking_id: string | null
          code_booking: string | null
          created_at: string
          created_by_role: string | null
          customer_id: string | null
          customer_name: string | null
          distance: string | null
          driver_id: string | null
          driver_name: string | null
          dropoff_location: string | null
          duration: string | null
          from_location: Json | null
          id: string
          id_driver: number | null
          license_plate: string | null
          make: string | null
          model: string | null
          passenger: number | null
          payment_method: string | null
          phone: string | null
          pickup_date: string | null
          pickup_location: string | null
          pickup_time: string | null
          price: number | null
          status: Database["public"]["Enums"]["transfer_status"] | null
          to_location: Json | null
          type: string | null
          vehicle_name: string | null
        }
        Insert: {
          airport_location?: string | null
          booking_id?: string | null
          code_booking?: string | null
          created_at?: string
          created_by_role?: string | null
          customer_id?: string | null
          customer_name?: string | null
          distance?: string | null
          driver_id?: string | null
          driver_name?: string | null
          dropoff_location?: string | null
          duration?: string | null
          from_location?: Json | null
          id: string
          id_driver?: number | null
          license_plate?: string | null
          make?: string | null
          model?: string | null
          passenger?: number | null
          payment_method?: string | null
          phone?: string | null
          pickup_date?: string | null
          pickup_location?: string | null
          pickup_time?: string | null
          price?: number | null
          status?: Database["public"]["Enums"]["transfer_status"] | null
          to_location?: Json | null
          type?: string | null
          vehicle_name?: string | null
        }
        Update: {
          airport_location?: string | null
          booking_id?: string | null
          code_booking?: string | null
          created_at?: string
          created_by_role?: string | null
          customer_id?: string | null
          customer_name?: string | null
          distance?: string | null
          driver_id?: string | null
          driver_name?: string | null
          dropoff_location?: string | null
          duration?: string | null
          from_location?: Json | null
          id?: string
          id_driver?: number | null
          license_plate?: string | null
          make?: string | null
          model?: string | null
          passenger?: number | null
          payment_method?: string | null
          phone?: string | null
          pickup_date?: string | null
          pickup_location?: string | null
          pickup_time?: string | null
          price?: number | null
          status?: Database["public"]["Enums"]["transfer_status"] | null
          to_location?: Json | null
          type?: string | null
          vehicle_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "airport_transfer_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      airport_transfer_notifications: {
        Row: {
          created_at: string | null
          driver_id: string
          id: number
          message: string | null
          status: string | null
          transfer_id: number
        }
        Insert: {
          created_at?: string | null
          driver_id: string
          id?: number
          message?: string | null
          status?: string | null
          transfer_id: number
        }
        Update: {
          created_at?: string | null
          driver_id?: string
          id?: number
          message?: string | null
          status?: string | null
          transfer_id?: number
        }
        Relationships: []
      }
      api_settings: {
        Row: {
          created_at: string | null
          fonte_api_key: string | null
          google_maps_key: string | null
          id: number
          openai_api_key: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fonte_api_key?: string | null
          google_maps_key?: string | null
          id: number
          openai_api_key?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fonte_api_key?: string | null
          google_maps_key?: string | null
          id?: number
          openai_api_key?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      attendance: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string | null
          date: string
          employee_id: string | null
          id: string
          location_check_in: Json | null
          location_check_out: Json | null
          selfie_check_in: string | null
          selfie_check_out: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date: string
          employee_id?: string | null
          id?: string
          location_check_in?: Json | null
          location_check_out?: Json | null
          selfie_check_in?: string | null
          selfie_check_out?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date?: string
          employee_id?: string | null
          id?: string
          location_check_in?: Json | null
          location_check_out?: Json | null
          selfie_check_in?: string | null
          selfie_check_out?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_error_logs: {
        Row: {
          email: string | null
          error_message: string | null
          error_time: string | null
          id: number
          raw_user_meta_data: Json | null
          user_id: string | null
        }
        Insert: {
          email?: string | null
          error_message?: string | null
          error_time?: string | null
          id?: never
          raw_user_meta_data?: Json | null
          user_id?: string | null
        }
        Update: {
          email?: string | null
          error_message?: string | null
          error_time?: string | null
          id?: never
          raw_user_meta_data?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      baggage_booking: {
        Row: {
          airport: string
          baggage_size: string
          booking_date: string | null
          booking_id: string | null
          code_booking: string | null
          created_at: string | null
          created_by_role: string | null
          customer_email: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          duration: number
          duration_type: string
          end_date: string
          end_time: string | null
          flight_number: string | null
          hours: number | null
          id: string
          item_name: string | null
          journal_entry_id: string | null
          payment_id: string | null
          payment_method: string | null
          price: number
          quantity: number | null
          start_date: string
          start_time: string | null
          status: string
          storage_location: string | null
          terminal: string
          total_amount: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          airport: string
          baggage_size: string
          booking_date?: string | null
          booking_id?: string | null
          code_booking?: string | null
          created_at?: string | null
          created_by_role?: string | null
          customer_email: string
          customer_id?: string | null
          customer_name?: string
          customer_phone: string
          duration: number
          duration_type: string
          end_date: string
          end_time?: string | null
          flight_number?: string | null
          hours?: number | null
          id?: string
          item_name?: string | null
          journal_entry_id?: string | null
          payment_id?: string | null
          payment_method?: string | null
          price: number
          quantity?: number | null
          start_date: string
          start_time?: string | null
          status?: string
          storage_location?: string | null
          terminal: string
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          airport?: string
          baggage_size?: string
          booking_date?: string | null
          booking_id?: string | null
          code_booking?: string | null
          created_at?: string | null
          created_by_role?: string | null
          customer_email?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          duration?: number
          duration_type?: string
          end_date?: string
          end_time?: string | null
          flight_number?: string | null
          hours?: number | null
          id?: string
          item_name?: string | null
          journal_entry_id?: string | null
          payment_id?: string | null
          payment_method?: string | null
          price?: number
          quantity?: number | null
          start_date?: string
          start_time?: string | null
          status?: string
          storage_location?: string | null
          terminal?: string
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_payment_id"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      baggage_price: {
        Row: {
          baggage_prices: number | null
          baggage_size: string
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          baggage_prices?: number | null
          baggage_size: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          baggage_prices?: number | null
          baggage_size?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      booking_cars: {
        Row: {
          amount: number | null
          basic_price: number | null
          car_type: string | null
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          driver_name: string | null
          dsp_name: string | null
          id: number
          katim_name: string | null
          kode_booking: string | null
          paid_type: string | null
          parking: number | null
          pickup_date: string | null
          plat_no: string | null
          sell_price: number | null
          status: string | null
          surcharge: number | null
          timer: number | null
          upselling: number | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          basic_price?: number | null
          car_type?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          driver_name?: string | null
          dsp_name?: string | null
          id?: number
          katim_name?: string | null
          kode_booking?: string | null
          paid_type?: string | null
          parking?: number | null
          pickup_date?: string | null
          plat_no?: string | null
          sell_price?: number | null
          status?: string | null
          surcharge?: number | null
          timer?: number | null
          upselling?: number | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          basic_price?: number | null
          car_type?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          driver_name?: string | null
          dsp_name?: string | null
          id?: number
          katim_name?: string | null
          kode_booking?: string | null
          paid_type?: string | null
          parking?: number | null
          pickup_date?: string | null
          plat_no?: string | null
          sell_price?: number | null
          status?: string | null
          surcharge?: number | null
          timer?: number | null
          upselling?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      booking_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          amount: number | null
          bank_account: string | null
          booking_date: string | null
          booking_id: string | null
          bookings_status: string | null
          code_booking: string | null
          created_at: string | null
          created_by_role: string | null
          customer_id: string | null
          DATE_PART: number | null
          discount_percent: number | null
          driver_id: string | null
          driver_name: string | null
          driver_option: string | null
          drivers_id: string | null
          duration: number | null
          end_date: string | null
          id: string
          journal_entry_id: string | null
          license_plate: string | null
          make: string | null
          model: string | null
          name: string | null
          notes: string | null
          overdue: number | null
          paid_amount: number | null
          partner_id: string | null
          payment_id: string | null
          payment_method: string | null
          payment_status: string | null
          pickup_time: string | null
          plate_number: string | null
          price: number | null
          quantity: number | null
          reference_number: string | null
          remaining_payment: number | null
          remaining_payments: number | null
          return_time: string | null
          role_id: number | null
          role_name: string | null
          services_id: string | null
          start_date: string | null
          start_time: string | null
          status: string | null
          total_amount: number
          transaction_id: string | null
          user_id: string | null
          vehicle_id: string | null
          vehicle_name: string | null
          vehicle_type: string | null
          with_driver: boolean | null
        }
        Insert: {
          amount?: number | null
          bank_account?: string | null
          booking_date?: string | null
          booking_id?: string | null
          bookings_status?: string | null
          code_booking?: string | null
          created_at?: string | null
          created_by_role?: string | null
          customer_id?: string | null
          DATE_PART?: number | null
          discount_percent?: number | null
          driver_id?: string | null
          driver_name?: string | null
          driver_option?: string | null
          drivers_id?: string | null
          duration?: number | null
          end_date?: string | null
          id?: string
          journal_entry_id?: string | null
          license_plate?: string | null
          make?: string | null
          model?: string | null
          name?: string | null
          notes?: string | null
          overdue?: number | null
          paid_amount?: number | null
          partner_id?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          pickup_time?: string | null
          plate_number?: string | null
          price?: number | null
          quantity?: number | null
          reference_number?: string | null
          remaining_payment?: number | null
          remaining_payments?: number | null
          return_time?: string | null
          role_id?: number | null
          role_name?: string | null
          services_id?: string | null
          start_date?: string | null
          start_time?: string | null
          status?: string | null
          total_amount: number
          transaction_id?: string | null
          user_id?: string | null
          vehicle_id?: string | null
          vehicle_name?: string | null
          vehicle_type?: string | null
          with_driver?: boolean | null
        }
        Update: {
          amount?: number | null
          bank_account?: string | null
          booking_date?: string | null
          booking_id?: string | null
          bookings_status?: string | null
          code_booking?: string | null
          created_at?: string | null
          created_by_role?: string | null
          customer_id?: string | null
          DATE_PART?: number | null
          discount_percent?: number | null
          driver_id?: string | null
          driver_name?: string | null
          driver_option?: string | null
          drivers_id?: string | null
          duration?: number | null
          end_date?: string | null
          id?: string
          journal_entry_id?: string | null
          license_plate?: string | null
          make?: string | null
          model?: string | null
          name?: string | null
          notes?: string | null
          overdue?: number | null
          paid_amount?: number | null
          partner_id?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          pickup_time?: string | null
          plate_number?: string | null
          price?: number | null
          quantity?: number | null
          reference_number?: string | null
          remaining_payment?: number | null
          remaining_payments?: number | null
          return_time?: string | null
          role_id?: number | null
          role_name?: string | null
          services_id?: string | null
          start_date?: string | null
          start_time?: string | null
          status?: string | null
          total_amount?: number
          transaction_id?: string | null
          user_id?: string | null
          vehicle_id?: string | null
          vehicle_name?: string | null
          vehicle_type?: string | null
          with_driver?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bookings_journal_entry"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bookings_journal_entry"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries_with_bookings"
            referencedColumns: ["journal_entry_id"]
          },
          {
            foreignKeyName: "fk_bookings_vehicle"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings_trips: {
        Row: {
          additional_data: string | null
          bank_account: string | null
          code_booking: string | null
          created_at: string
          driver_name: string | null
          fee_sales: number | null
          harga_basic: number | null
          harga_jual: number | null
          id: string
          jam_checkin: string | null
          jam_checkout: string | null
          jenis_kendaraan: string | null
          journal_entry_id: string | null
          jumlah_hari: number | null
          jumlah_kamar: number | null
          jumlah_malam: number | null
          kelebihan_bagasi: number | null
          keterangan: string | null
          kode_booking: string | null
          kode_transaksi: string | null
          license_plate: string | null
          lokasi: string | null
          lokasi_hotel: string | null
          nama_penumpang: string | null
          no_telepon: number | null
          nomor_plat: string | null
          paid_amount: number | null
          payment_method: string | null
          price: number | null
          profit: number | null
          quantity: number | null
          service_details: string | null
          service_name: string | null
          service_type: string | null
          status: string | null
          tanggal: string | null
          tanggal_checkin: string | null
          tanggal_checkout: string | null
          total_amount: number | null
          total_price: number | null
          tujuan: string | null
          type_unit: string | null
          user_id: string | null
        }
        Insert: {
          additional_data?: string | null
          bank_account?: string | null
          code_booking?: string | null
          created_at?: string
          driver_name?: string | null
          fee_sales?: number | null
          harga_basic?: number | null
          harga_jual?: number | null
          id?: string
          jam_checkin?: string | null
          jam_checkout?: string | null
          jenis_kendaraan?: string | null
          journal_entry_id?: string | null
          jumlah_hari?: number | null
          jumlah_kamar?: number | null
          jumlah_malam?: number | null
          kelebihan_bagasi?: number | null
          keterangan?: string | null
          kode_booking?: string | null
          kode_transaksi?: string | null
          license_plate?: string | null
          lokasi?: string | null
          lokasi_hotel?: string | null
          nama_penumpang?: string | null
          no_telepon?: number | null
          nomor_plat?: string | null
          paid_amount?: number | null
          payment_method?: string | null
          price?: number | null
          profit?: number | null
          quantity?: number | null
          service_details?: string | null
          service_name?: string | null
          service_type?: string | null
          status?: string | null
          tanggal?: string | null
          tanggal_checkin?: string | null
          tanggal_checkout?: string | null
          total_amount?: number | null
          total_price?: number | null
          tujuan?: string | null
          type_unit?: string | null
          user_id?: string | null
        }
        Update: {
          additional_data?: string | null
          bank_account?: string | null
          code_booking?: string | null
          created_at?: string
          driver_name?: string | null
          fee_sales?: number | null
          harga_basic?: number | null
          harga_jual?: number | null
          id?: string
          jam_checkin?: string | null
          jam_checkout?: string | null
          jenis_kendaraan?: string | null
          journal_entry_id?: string | null
          jumlah_hari?: number | null
          jumlah_kamar?: number | null
          jumlah_malam?: number | null
          kelebihan_bagasi?: number | null
          keterangan?: string | null
          kode_booking?: string | null
          kode_transaksi?: string | null
          license_plate?: string | null
          lokasi?: string | null
          lokasi_hotel?: string | null
          nama_penumpang?: string | null
          no_telepon?: number | null
          nomor_plat?: string | null
          paid_amount?: number | null
          payment_method?: string | null
          price?: number | null
          profit?: number | null
          quantity?: number | null
          service_details?: string | null
          service_name?: string | null
          service_type?: string | null
          status?: string | null
          tanggal?: string | null
          tanggal_checkin?: string | null
          tanggal_checkout?: string | null
          total_amount?: number | null
          total_price?: number | null
          tujuan?: string | null
          type_unit?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      branches: {
        Row: {
          address: string | null
          code: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          work_place_id: string | null
        }
        Insert: {
          address?: string | null
          code?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          work_place_id?: string | null
        }
        Update: {
          address?: string | null
          code?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          work_place_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_work_place_id_fkey"
            columns: ["work_place_id"]
            isOneToOne: false
            referencedRelation: "work_places"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          account_code: string
          account_id: string | null
          account_name: string
          account_type: string
          balance_total: number | null
          code: string | null
          created_at: string
          credit_total: number | null
          current_balance: number | null
          debit_total: number | null
          description: string | null
          id: string
          is_debit: number | null
          is_header: boolean | null
          name: string | null
          normal_balance: string | null
          parent_id: string | null
          total_credit: number | null
          total_debit: number | null
          total_price: number | null
          updated_at: string
        }
        Insert: {
          account_code: string
          account_id?: string | null
          account_name: string
          account_type: string
          balance_total?: number | null
          code?: string | null
          created_at?: string
          credit_total?: number | null
          current_balance?: number | null
          debit_total?: number | null
          description?: string | null
          id?: string
          is_debit?: number | null
          is_header?: boolean | null
          name?: string | null
          normal_balance?: string | null
          parent_id?: string | null
          total_credit?: number | null
          total_debit?: number | null
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          account_code?: string
          account_id?: string | null
          account_name?: string
          account_type?: string
          balance_total?: number | null
          code?: string | null
          created_at?: string
          credit_total?: number | null
          current_balance?: number | null
          debit_total?: number | null
          description?: string | null
          id?: string
          is_debit?: number | null
          is_header?: boolean | null
          name?: string | null
          normal_balance?: string | null
          parent_id?: string | null
          total_credit?: number | null
          total_debit?: number | null
          total_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          category: string | null
          created_at: string | null
          damage_value: number
          description: string | null
          id: string
          inspection_id: string | null
          item_name: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          damage_value?: number
          description?: string | null
          id?: string
          inspection_id?: string | null
          item_name: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          damage_value?: number
          description?: string | null
          id?: string
          inspection_id?: string | null
          item_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_inspection"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          created_at: string | null
          id: string
          name: string
          npwp: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          name: string
          npwp?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          name?: string
          npwp?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string | null
          customer_code: string | null
          email: string | null
          full_name: string | null
          id: string
          ktp_paspor_url: string | null
          name: string | null
          phone: string | null
          role_id: number | null
          role_name: string | null
          selfie_url: string | null
          tempat_lahir: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          customer_code?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          ktp_paspor_url?: string | null
          name?: string | null
          phone?: string | null
          role_id?: number | null
          role_name?: string | null
          selfie_url?: string | null
          tempat_lahir?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          customer_code?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          ktp_paspor_url?: string | null
          name?: string | null
          phone?: string | null
          role_id?: number | null
          role_name?: string | null
          selfie_url?: string | null
          tempat_lahir?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
          {
            foreignKeyName: "customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "agent_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      damages: {
        Row: {
          amount: number | null
          booking_id: string | null
          created_at: string | null
          description: string | null
          id: string
          payment_id: string | null
          payment_status: string | null
        }
        Insert: {
          amount?: number | null
          booking_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          payment_id?: string | null
          payment_status?: string | null
        }
        Update: {
          amount?: number | null
          booking_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          payment_id?: string | null
          payment_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "damages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "journal_entries_with_bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "damages_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      debug_log: {
        Row: {
          created_at: string | null
          data: Json | null
          id: number
          message: string | null
          timestamp: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: number
          message?: string | null
          timestamp?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: number
          message?: string | null
          timestamp?: string | null
        }
        Relationships: []
      }
      divisions: {
        Row: {
          code: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      drivers: {
        Row: {
          account_status: string | null
          address: string | null
          agama: string | null
          alamat: string | null
          back_image_url: string | null
          birth_date: string | null
          birth_place: string | null
          bpkb_url: string | null
          category: string | null
          color: string | null
          created_at: string | null
          discount_percent: number | null
          driver_status: string | null
          driver_type: string | null
          drivers_seats: string | null
          education: string | null
          email: string | null
          emergency_contact: string | null
          ethnicity: string | null
          family_phone_number: string | null
          first_name: string | null
          front_image_url: string | null
          fuel_type: string | null
          full_name: string | null
          id: string
          id_driver: number | null
          interior_image_url: string | null
          is_online: boolean | null
          kk_url: string | null
          ktp_address: string | null
          ktp_number: string | null
          ktp_url: string | null
          last_name: string | null
          license_expiry: string | null
          license_number: string | null
          license_plate: string | null
          make: string | null
          model: string | null
          name: string
          nickname: string | null
          no_urut: number | null
          overdue_days: number | null
          phone_number: string | null
          reference_phone: number | null
          religion: string | null
          role_id: number | null
          role_name: string | null
          saldo: number | null
          seats: number | null
          selfie_url: string | null
          side_image_url: string | null
          sim_url: string | null
          skck_image: string | null
          skck_url: string | null
          status: string | null
          stnk_expiry: string | null
          stnk_url: string | null
          suku: string | null
          tanggal_lahir: string | null
          tempat_lahir: string | null
          total_overdue: number | null
          transmission: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
          vehicle_brand: string | null
          vehicle_color: string | null
          vehicle_name: string | null
          vehicle_status: string | null
          vehicle_type: string | null
          vehicle_year: string | null
          year: number | null
        }
        Insert: {
          account_status?: string | null
          address?: string | null
          agama?: string | null
          alamat?: string | null
          back_image_url?: string | null
          birth_date?: string | null
          birth_place?: string | null
          bpkb_url?: string | null
          category?: string | null
          color?: string | null
          created_at?: string | null
          discount_percent?: number | null
          driver_status?: string | null
          driver_type?: string | null
          drivers_seats?: string | null
          education?: string | null
          email?: string | null
          emergency_contact?: string | null
          ethnicity?: string | null
          family_phone_number?: string | null
          first_name?: string | null
          front_image_url?: string | null
          fuel_type?: string | null
          full_name?: string | null
          id?: string
          id_driver?: number | null
          interior_image_url?: string | null
          is_online?: boolean | null
          kk_url?: string | null
          ktp_address?: string | null
          ktp_number?: string | null
          ktp_url?: string | null
          last_name?: string | null
          license_expiry?: string | null
          license_number?: string | null
          license_plate?: string | null
          make?: string | null
          model?: string | null
          name: string
          nickname?: string | null
          no_urut?: number | null
          overdue_days?: number | null
          phone_number?: string | null
          reference_phone?: number | null
          religion?: string | null
          role_id?: number | null
          role_name?: string | null
          saldo?: number | null
          seats?: number | null
          selfie_url?: string | null
          side_image_url?: string | null
          sim_url?: string | null
          skck_image?: string | null
          skck_url?: string | null
          status?: string | null
          stnk_expiry?: string | null
          stnk_url?: string | null
          suku?: string | null
          tanggal_lahir?: string | null
          tempat_lahir?: string | null
          total_overdue?: number | null
          transmission?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_brand?: string | null
          vehicle_color?: string | null
          vehicle_name?: string | null
          vehicle_status?: string | null
          vehicle_type?: string | null
          vehicle_year?: string | null
          year?: number | null
        }
        Update: {
          account_status?: string | null
          address?: string | null
          agama?: string | null
          alamat?: string | null
          back_image_url?: string | null
          birth_date?: string | null
          birth_place?: string | null
          bpkb_url?: string | null
          category?: string | null
          color?: string | null
          created_at?: string | null
          discount_percent?: number | null
          driver_status?: string | null
          driver_type?: string | null
          drivers_seats?: string | null
          education?: string | null
          email?: string | null
          emergency_contact?: string | null
          ethnicity?: string | null
          family_phone_number?: string | null
          first_name?: string | null
          front_image_url?: string | null
          fuel_type?: string | null
          full_name?: string | null
          id?: string
          id_driver?: number | null
          interior_image_url?: string | null
          is_online?: boolean | null
          kk_url?: string | null
          ktp_address?: string | null
          ktp_number?: string | null
          ktp_url?: string | null
          last_name?: string | null
          license_expiry?: string | null
          license_number?: string | null
          license_plate?: string | null
          make?: string | null
          model?: string | null
          name?: string
          nickname?: string | null
          no_urut?: number | null
          overdue_days?: number | null
          phone_number?: string | null
          reference_phone?: number | null
          religion?: string | null
          role_id?: number | null
          role_name?: string | null
          saldo?: number | null
          seats?: number | null
          selfie_url?: string | null
          side_image_url?: string | null
          sim_url?: string | null
          skck_image?: string | null
          skck_url?: string | null
          status?: string | null
          stnk_expiry?: string | null
          stnk_url?: string | null
          suku?: string | null
          tanggal_lahir?: string | null
          tempat_lahir?: string | null
          total_overdue?: number | null
          transmission?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_brand?: string | null
          vehicle_color?: string | null
          vehicle_name?: string | null
          vehicle_status?: string | null
          vehicle_type?: string | null
          vehicle_year?: string | null
          year?: number | null
        }
        Relationships: []
      }
      drivers_travelincars: {
        Row: {
          address: string | null
          agama: string | null
          alamat: string | null
          back_image_url: string | null
          birth_date: string | null
          birth_place: string | null
          bpkb_url: string | null
          category: string | null
          color: string | null
          created_at: string | null
          discount_percent: number | null
          driver_type: string | null
          email: string | null
          emergency_contact: string | null
          family_phone: string | null
          first_name: string | null
          front_image_url: string | null
          fuel_type: string | null
          full_name: string | null
          id: string
          id_driver: number | null
          interior_image_url: string | null
          kk_url: string | null
          ktp_address: string | null
          ktp_number: string | null
          ktp_url: string | null
          last_name: string | null
          license_expiry: string | null
          license_number: string | null
          license_plate: string | null
          make: string | null
          model: string | null
          name: string
          nickname: string | null
          no_urut: number | null
          overdue_days: number | null
          phone: string | null
          phone_number: number | null
          reference_phone: number | null
          relative_phone: string | null
          religion: string | null
          role_id: number | null
          role_name: string | null
          saldo: number | null
          seats: number | null
          selfie_url: string | null
          side_image_url: string | null
          sim_url: string | null
          skck_image: string | null
          skck_url: string | null
          status: string | null
          stnk_expiry: string | null
          stnk_url: string | null
          suku: string | null
          tanggal_lahir: string | null
          tempat_lahir: string | null
          total_overdue: number | null
          transmission: string | null
          type: string | null
          updated_at: string | null
          vehicle_type: string | null
          year: number | null
        }
        Insert: {
          address?: string | null
          agama?: string | null
          alamat?: string | null
          back_image_url?: string | null
          birth_date?: string | null
          birth_place?: string | null
          bpkb_url?: string | null
          category?: string | null
          color?: string | null
          created_at?: string | null
          discount_percent?: number | null
          driver_type?: string | null
          email?: string | null
          emergency_contact?: string | null
          family_phone?: string | null
          first_name?: string | null
          front_image_url?: string | null
          fuel_type?: string | null
          full_name?: string | null
          id?: string
          id_driver?: number | null
          interior_image_url?: string | null
          kk_url?: string | null
          ktp_address?: string | null
          ktp_number?: string | null
          ktp_url?: string | null
          last_name?: string | null
          license_expiry?: string | null
          license_number?: string | null
          license_plate?: string | null
          make?: string | null
          model?: string | null
          name: string
          nickname?: string | null
          no_urut?: number | null
          overdue_days?: number | null
          phone?: string | null
          phone_number?: number | null
          reference_phone?: number | null
          relative_phone?: string | null
          religion?: string | null
          role_id?: number | null
          role_name?: string | null
          saldo?: number | null
          seats?: number | null
          selfie_url?: string | null
          side_image_url?: string | null
          sim_url?: string | null
          skck_image?: string | null
          skck_url?: string | null
          status?: string | null
          stnk_expiry?: string | null
          stnk_url?: string | null
          suku?: string | null
          tanggal_lahir?: string | null
          tempat_lahir?: string | null
          total_overdue?: number | null
          transmission?: string | null
          type?: string | null
          updated_at?: string | null
          vehicle_type?: string | null
          year?: number | null
        }
        Update: {
          address?: string | null
          agama?: string | null
          alamat?: string | null
          back_image_url?: string | null
          birth_date?: string | null
          birth_place?: string | null
          bpkb_url?: string | null
          category?: string | null
          color?: string | null
          created_at?: string | null
          discount_percent?: number | null
          driver_type?: string | null
          email?: string | null
          emergency_contact?: string | null
          family_phone?: string | null
          first_name?: string | null
          front_image_url?: string | null
          fuel_type?: string | null
          full_name?: string | null
          id?: string
          id_driver?: number | null
          interior_image_url?: string | null
          kk_url?: string | null
          ktp_address?: string | null
          ktp_number?: string | null
          ktp_url?: string | null
          last_name?: string | null
          license_expiry?: string | null
          license_number?: string | null
          license_plate?: string | null
          make?: string | null
          model?: string | null
          name?: string
          nickname?: string | null
          no_urut?: number | null
          overdue_days?: number | null
          phone?: string | null
          phone_number?: number | null
          reference_phone?: number | null
          relative_phone?: string | null
          religion?: string | null
          role_id?: number | null
          role_name?: string | null
          saldo?: number | null
          seats?: number | null
          selfie_url?: string | null
          side_image_url?: string | null
          sim_url?: string | null
          skck_image?: string | null
          skck_url?: string | null
          status?: string | null
          stnk_expiry?: string | null
          stnk_url?: string | null
          suku?: string | null
          tanggal_lahir?: string | null
          tempat_lahir?: string | null
          total_overdue?: number | null
          transmission?: string | null
          type?: string | null
          updated_at?: string | null
          vehicle_type?: string | null
          year?: number | null
        }
        Relationships: []
      }
      employee_location_assignments: {
        Row: {
          created_at: string | null
          employee_id: string
          id: string
          location_id: string
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          id?: string
          location_id: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          id?: string
          location_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_location_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_location_assignments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "geofence_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          avatar: string | null
          branch: string
          branch_id: string | null
          created_at: string | null
          division: string
          employee_id: string
          full_name: string | null
          id: string
          name: string
          role_id: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          avatar?: string | null
          branch: string
          branch_id?: string | null
          created_at?: string | null
          division: string
          employee_id: string
          full_name?: string | null
          id?: string
          name: string
          role_id?: number | null
          status: string
          updated_at?: string | null
        }
        Update: {
          avatar?: string | null
          branch?: string
          branch_id?: string | null
          created_at?: string | null
          division?: string
          employee_id?: string
          full_name?: string | null
          id?: string
          name?: string
          role_id?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_employees_branch"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      employment_statuses: {
        Row: {
          code: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      fee_sharing_rules: {
        Row: {
          company_share: number
          created_at: string | null
          fee_percent: number
          id: string
          partner_id: string | null
          partner_share: number
          service_id: string | null
        }
        Insert: {
          company_share: number
          created_at?: string | null
          fee_percent: number
          id?: string
          partner_id?: string | null
          partner_share: number
          service_id?: string | null
        }
        Update: {
          company_share?: number
          created_at?: string | null
          fee_percent?: number
          id?: string
          partner_id?: string | null
          partner_share?: number
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_sharing_rules_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_sharing_rules_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      freelance_payments: {
        Row: {
          amount: number
          bonus_amount: number | null
          created_at: string | null
          date: string
          freelancer_id: string | null
          hours: number | null
          id: string
          payment_type: string
          project_id: string | null
          rate: number | null
          rating: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          bonus_amount?: number | null
          created_at?: string | null
          date: string
          freelancer_id?: string | null
          hours?: number | null
          id?: string
          payment_type: string
          project_id?: string | null
          rate?: number | null
          rating?: number | null
          status: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          bonus_amount?: number | null
          created_at?: string | null
          date?: string
          freelancer_id?: string | null
          hours?: number | null
          id?: string
          payment_type?: string
          project_id?: string | null
          rate?: number | null
          rating?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "freelance_payments_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "freelance_payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "freelance_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      freelance_projects: {
        Row: {
          assigned_to: string | null
          budget: string
          category: string
          created_at: string | null
          deadline: string
          description: string
          id: string
          payment_type: string
          progress: number | null
          rating: number | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          budget: string
          category: string
          created_at?: string | null
          deadline: string
          description: string
          id?: string
          payment_type: string
          progress?: number | null
          rating?: number | null
          status: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          budget?: string
          category?: string
          created_at?: string | null
          deadline?: string
          description?: string
          id?: string
          payment_type?: string
          progress?: number | null
          rating?: number | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "freelance_projects_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      freelance_shift_assignments: {
        Row: {
          created_at: string | null
          freelancer_id: string | null
          id: string
          shift_id: string | null
        }
        Insert: {
          created_at?: string | null
          freelancer_id?: string | null
          id?: string
          shift_id?: string | null
        }
        Update: {
          created_at?: string | null
          freelancer_id?: string | null
          id?: string
          shift_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "freelance_shift_assignments_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "freelance_shift_assignments_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "freelance_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      freelance_shifts: {
        Row: {
          branch: string
          capacity: number
          created_at: string | null
          date: string
          end_time: string
          id: string
          name: string
          start_time: string
          status: string
          updated_at: string | null
        }
        Insert: {
          branch: string
          capacity: number
          created_at?: string | null
          date: string
          end_time: string
          id?: string
          name: string
          start_time: string
          status: string
          updated_at?: string | null
        }
        Update: {
          branch?: string
          capacity?: number
          created_at?: string | null
          date?: string
          end_time?: string
          id?: string
          name?: string
          start_time?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      general_ledger: {
        Row: {
          account_code: string | null
          account_id: string
          account_name: string | null
          account_type: string | null
          balance: number | null
          booking_id: string | null
          created_at: string
          credit: number | null
          date: string
          debit: number | null
          description: string | null
          id: string
          is_manual_entry: string | null
          journal_entry_id: string | null
          journal_entry_item_id: string | null
          manual_entry: boolean | null
          normal_balance: string | null
          payment_id: string | null
          period_month: string | null
          reference_number: string | null
          running_balance: number
          total_credit: number | null
          total_debit: number | null
          transaction_date: string | null
          updated_at: string
        }
        Insert: {
          account_code?: string | null
          account_id: string
          account_name?: string | null
          account_type?: string | null
          balance?: number | null
          booking_id?: string | null
          created_at?: string
          credit?: number | null
          date: string
          debit?: number | null
          description?: string | null
          id?: string
          is_manual_entry?: string | null
          journal_entry_id?: string | null
          journal_entry_item_id?: string | null
          manual_entry?: boolean | null
          normal_balance?: string | null
          payment_id?: string | null
          period_month?: string | null
          reference_number?: string | null
          running_balance?: number
          total_credit?: number | null
          total_debit?: number | null
          transaction_date?: string | null
          updated_at?: string
        }
        Update: {
          account_code?: string | null
          account_id?: string
          account_name?: string | null
          account_type?: string | null
          balance?: number | null
          booking_id?: string | null
          created_at?: string
          credit?: number | null
          date?: string
          debit?: number | null
          description?: string | null
          id?: string
          is_manual_entry?: string | null
          journal_entry_id?: string | null
          journal_entry_item_id?: string | null
          manual_entry?: boolean | null
          normal_balance?: string | null
          payment_id?: string | null
          period_month?: string | null
          reference_number?: string | null
          running_balance?: number
          total_credit?: number | null
          total_debit?: number | null
          transaction_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_general_ledger_journal_entry_item"
            columns: ["journal_entry_item_id"]
            isOneToOne: false
            referencedRelation: "journal_entry_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_general_ledger_journal_entry_item"
            columns: ["journal_entry_item_id"]
            isOneToOne: false
            referencedRelation: "journal_entry_items_with_ledger"
            referencedColumns: ["journal_entry_item_id"]
          },
          {
            foreignKeyName: "general_ledger_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "general_ledger_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "general_ledger_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries_with_bookings"
            referencedColumns: ["journal_entry_id"]
          },
        ]
      }
      general_ledger_changes: {
        Row: {
          affected_period_end: string
          affected_period_start: string
          created_at: string | null
          id: string
        }
        Insert: {
          affected_period_end: string
          affected_period_start: string
          created_at?: string | null
          id?: string
        }
        Update: {
          affected_period_end?: string
          affected_period_start?: string
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      geofence_locations: {
        Row: {
          branch_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          latitude: number
          longitude: number
          name: string
          radius: number
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          latitude: number
          longitude: number
          name: string
          radius?: number
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          radius?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "geofence_locations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      handling_bookings: {
        Row: {
          additional_notes: string | null
          bank_name: string | null
          booking_date: string | null
          booking_id: string | null
          category: string
          category_price: number | null
          code_booking: string | null
          company_name: string | null
          created_at: string | null
          created_by_role: string | null
          customer_email: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          dropoff_area: string | null
          extra_baggage_count: number | null
          flight_number: string
          id: string
          journal_entry_id: string | null
          passenger_area: string
          passengers: number | null
          payment_id: string | null
          payment_method: string | null
          payment_status: string | null
          pickup_area: string
          pickup_date: string
          pickup_time: string
          price: number | null
          quantity: number | null
          service_price: number | null
          status: string | null
          total_amount: number | null
          total_price: number
          travel_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          additional_notes?: string | null
          bank_name?: string | null
          booking_date?: string | null
          booking_id?: string | null
          category: string
          category_price?: number | null
          code_booking?: string | null
          company_name?: string | null
          created_at?: string | null
          created_by_role?: string | null
          customer_email: string
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          dropoff_area?: string | null
          extra_baggage_count?: number | null
          flight_number: string
          id?: string
          journal_entry_id?: string | null
          passenger_area: string
          passengers?: number | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          pickup_area: string
          pickup_date: string
          pickup_time?: string
          price?: number | null
          quantity?: number | null
          service_price?: number | null
          status?: string | null
          total_amount?: number | null
          total_price: number
          travel_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          additional_notes?: string | null
          bank_name?: string | null
          booking_date?: string | null
          booking_id?: string | null
          category?: string
          category_price?: number | null
          code_booking?: string | null
          company_name?: string | null
          created_at?: string | null
          created_by_role?: string | null
          customer_email?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          dropoff_area?: string | null
          extra_baggage_count?: number | null
          flight_number?: string
          id?: string
          journal_entry_id?: string | null
          passenger_area?: string
          passengers?: number | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          pickup_area?: string
          pickup_date?: string
          pickup_time?: string
          price?: number | null
          quantity?: number | null
          service_price?: number | null
          status?: string | null
          total_amount?: number | null
          total_price?: number
          travel_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      handling_prices: {
        Row: {
          base_price: number
          created_at: string | null
          id: string
          passenger_count: number
          service_type: string
        }
        Insert: {
          base_price: number
          created_at?: string | null
          id?: string
          passenger_count: number
          service_type: string
        }
        Update: {
          base_price?: number
          created_at?: string | null
          id?: string
          passenger_count?: number
          service_type?: string
        }
        Relationships: []
      }
      handling_umroh_price: {
        Row: {
          created_at: string | null
          id: string
          penumpang: number | null
          umroh_price: number
          umroh_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          penumpang?: number | null
          umroh_price: number
          umroh_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          penumpang?: number | null
          umroh_price?: number
          umroh_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      histori_transaksi: {
        Row: {
          id: string
          keterangan: string | null
          kode_booking: string
          nominal: number
          saldo_akhir: number
          trans_date: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          keterangan?: string | null
          kode_booking: string
          nominal: number
          saldo_akhir: number
          trans_date?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          keterangan?: string | null
          kode_booking?: string
          nominal?: number
          saldo_akhir?: number
          trans_date?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "histori_transaksi_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "agent_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "histori_transaksi_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      hrd: {
        Row: {
          created_at: string
          id: string | null
        }
        Insert: {
          created_at?: string
          id?: string | null
        }
        Update: {
          created_at?: string
          id?: string | null
        }
        Relationships: []
      }
      inspection_checklist_values: {
        Row: {
          checklist_item_id: string | null
          created_at: string | null
          fine_amount: number | null
          id: string
          inspection_id: string | null
          notes: string | null
          status_after: string | null
          status_before: string | null
        }
        Insert: {
          checklist_item_id?: string | null
          created_at?: string | null
          fine_amount?: number | null
          id?: string
          inspection_id?: string | null
          notes?: string | null
          status_after?: string | null
          status_before?: string | null
        }
        Update: {
          checklist_item_id?: string | null
          created_at?: string | null
          fine_amount?: number | null
          id?: string
          inspection_id?: string | null
          notes?: string | null
          status_after?: string | null
          status_before?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_checklist_values_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_checklist_values_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_items: {
        Row: {
          category: string | null
          created_at: string | null
          fine_amount: number | null
          id: string
          inspection_id: string | null
          item_name: string | null
          notes: string | null
          status_before: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          fine_amount?: number | null
          id?: string
          inspection_id?: string | null
          item_name?: string | null
          notes?: string | null
          status_before?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          fine_amount?: number | null
          id?: string
          inspection_id?: string | null
          item_name?: string | null
          notes?: string | null
          status_before?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_inspection_item"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_items_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          booking_id: string | null
          condition_notes: string | null
          created_at: string | null
          exterior_clean: boolean | null
          fee_breakdown: string | null
          fuel_level: string | null
          id: string
          inspection_type: string | null
          interior_clean: boolean | null
          odometer: number | null
          photo_urls: Json | null
          total_fees: number | null
          user_id: string | null
        }
        Insert: {
          booking_id?: string | null
          condition_notes?: string | null
          created_at?: string | null
          exterior_clean?: boolean | null
          fee_breakdown?: string | null
          fuel_level?: string | null
          id?: string
          inspection_type?: string | null
          interior_clean?: boolean | null
          odometer?: number | null
          photo_urls?: Json | null
          total_fees?: number | null
          user_id?: string | null
        }
        Update: {
          booking_id?: string | null
          condition_notes?: string | null
          created_at?: string | null
          exterior_clean?: boolean | null
          fee_breakdown?: string | null
          fuel_level?: string | null
          id?: string
          inspection_type?: string | null
          interior_clean?: boolean | null
          odometer?: number | null
          photo_urls?: Json | null
          total_fees?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      inventaris_kendaraan: {
        Row: {
          asuransi: string | null
          berakhir_asuransi: string | null
          berlaku_pajak: string | null
          berlaku_stnk: string | null
          bpkb_stnk: string | null
          bpkb_stnk_an: string | null
          created_at: string | null
          foto_belakang: string | null
          foto_bpkb: string | null
          foto_depan: string | null
          foto_interior: string | null
          foto_interior_depan: string | null
          foto_kanan_belakang: string | null
          foto_kiri_belakang: string | null
          foto_odometer: string | null
          foto_psk: string | null
          foto_samping_kana: string | null
          foto_samping_kanan: string | null
          foto_samping_kiri: string | null
          foto_stnk: string | null
          foto_tool_kit: string | null
          gage: string | null
          ganti_no_pol: string | null
          harga_sewa: number | null
          kep: string | null
          no_pol: string | null
          no_urut: number
          odo_akhir: number | null
          odo_awal: number | null
          perusahaan: string | null
          pos: string | null
          sheet_row_index: number | null
          status: string | null
          status_kendaraan: string | null
          status_vehicle: string | null
          tahun: string | null
          tanggal_berakhir: string | null
          tanggal_mulai: string | null
          type_unit: string | null
          updated_at: string | null
          vin: string | null
          warna: string | null
        }
        Insert: {
          asuransi?: string | null
          berakhir_asuransi?: string | null
          berlaku_pajak?: string | null
          berlaku_stnk?: string | null
          bpkb_stnk?: string | null
          bpkb_stnk_an?: string | null
          created_at?: string | null
          foto_belakang?: string | null
          foto_bpkb?: string | null
          foto_depan?: string | null
          foto_interior?: string | null
          foto_interior_depan?: string | null
          foto_kanan_belakang?: string | null
          foto_kiri_belakang?: string | null
          foto_odometer?: string | null
          foto_psk?: string | null
          foto_samping_kana?: string | null
          foto_samping_kanan?: string | null
          foto_samping_kiri?: string | null
          foto_stnk?: string | null
          foto_tool_kit?: string | null
          gage?: string | null
          ganti_no_pol?: string | null
          harga_sewa?: number | null
          kep?: string | null
          no_pol?: string | null
          no_urut: number
          odo_akhir?: number | null
          odo_awal?: number | null
          perusahaan?: string | null
          pos?: string | null
          sheet_row_index?: number | null
          status?: string | null
          status_kendaraan?: string | null
          status_vehicle?: string | null
          tahun?: string | null
          tanggal_berakhir?: string | null
          tanggal_mulai?: string | null
          type_unit?: string | null
          updated_at?: string | null
          vin?: string | null
          warna?: string | null
        }
        Update: {
          asuransi?: string | null
          berakhir_asuransi?: string | null
          berlaku_pajak?: string | null
          berlaku_stnk?: string | null
          bpkb_stnk?: string | null
          bpkb_stnk_an?: string | null
          created_at?: string | null
          foto_belakang?: string | null
          foto_bpkb?: string | null
          foto_depan?: string | null
          foto_interior?: string | null
          foto_interior_depan?: string | null
          foto_kanan_belakang?: string | null
          foto_kiri_belakang?: string | null
          foto_odometer?: string | null
          foto_psk?: string | null
          foto_samping_kana?: string | null
          foto_samping_kanan?: string | null
          foto_samping_kiri?: string | null
          foto_stnk?: string | null
          foto_tool_kit?: string | null
          gage?: string | null
          ganti_no_pol?: string | null
          harga_sewa?: number | null
          kep?: string | null
          no_pol?: string | null
          no_urut?: number
          odo_akhir?: number | null
          odo_awal?: number | null
          perusahaan?: string | null
          pos?: string | null
          sheet_row_index?: number | null
          status?: string | null
          status_kendaraan?: string | null
          status_vehicle?: string | null
          tahun?: string | null
          tanggal_berakhir?: string | null
          tanggal_mulai?: string | null
          type_unit?: string | null
          updated_at?: string | null
          vin?: string | null
          warna?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          created_at: string | null
          customer_id: string | null
          customer_name: string
          date: string
          description: string | null
          due_date: string
          id: string
          invoice_number: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          customer_id?: string | null
          customer_name: string
          date: string
          description?: string | null
          due_date: string
          id?: string
          invoice_number: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string
          date?: string
          description?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      item_vehicles: {
        Row: {
          category: string | null
          color: string | null
          created_at: string
          fuel_type: string | null
          id: number
          make: string | null
          model: string | null
          seats: number | null
          type: string | null
          year: number | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string
          fuel_type?: string | null
          id?: number
          make?: string | null
          model?: string | null
          seats?: number | null
          type?: string | null
          year?: number | null
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string
          fuel_type?: string | null
          id?: number
          make?: string | null
          model?: string | null
          seats?: number | null
          type?: string | null
          year?: number | null
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          account_code: string | null
          account_id: string | null
          account_name: string | null
          amount: number | null
          balance_total: number | null
          booking_id: string | null
          bookings_id: string | null
          created_at: string
          credit: number | null
          date: string
          debit: number | null
          description: string
          entry_date: string | null
          entry_type: string
          id: string
          journal_entry_id: string | null
          jurnal_id: string | null
          partner_id: string | null
          payment_id: string | null
          reference: string | null
          reference_code: string | null
          reference_id: string | null
          reference_number: string | null
          service_type: string | null
          services_id: string | null
          source_table: string | null
          status: string | null
          total_amount: number | null
          total_credit: number | null
          total_debit: number | null
          transaction_date: string | null
          updated_at: string
          user_id: string | null
          vehicle_name: string | null
          vehicle_type: string | null
        }
        Insert: {
          account_code?: string | null
          account_id?: string | null
          account_name?: string | null
          amount?: number | null
          balance_total?: number | null
          booking_id?: string | null
          bookings_id?: string | null
          created_at?: string
          credit?: number | null
          date?: string
          debit?: number | null
          description?: string
          entry_date?: string | null
          entry_type: string
          id?: string
          journal_entry_id?: string | null
          jurnal_id?: string | null
          partner_id?: string | null
          payment_id?: string | null
          reference?: string | null
          reference_code?: string | null
          reference_id?: string | null
          reference_number?: string | null
          service_type?: string | null
          services_id?: string | null
          source_table?: string | null
          status?: string | null
          total_amount?: number | null
          total_credit?: number | null
          total_debit?: number | null
          transaction_date?: string | null
          updated_at?: string
          user_id?: string | null
          vehicle_name?: string | null
          vehicle_type?: string | null
        }
        Update: {
          account_code?: string | null
          account_id?: string | null
          account_name?: string | null
          amount?: number | null
          balance_total?: number | null
          booking_id?: string | null
          bookings_id?: string | null
          created_at?: string
          credit?: number | null
          date?: string
          debit?: number | null
          description?: string
          entry_date?: string | null
          entry_type?: string
          id?: string
          journal_entry_id?: string | null
          jurnal_id?: string | null
          partner_id?: string | null
          payment_id?: string | null
          reference?: string | null
          reference_code?: string | null
          reference_id?: string | null
          reference_number?: string | null
          service_type?: string | null
          services_id?: string | null
          source_table?: string | null
          status?: string | null
          total_amount?: number | null
          total_credit?: number | null
          total_debit?: number | null
          transaction_date?: string | null
          updated_at?: string
          user_id?: string | null
          vehicle_name?: string | null
          vehicle_type?: string | null
        }
        Relationships: []
      }
      journal_entry_items: {
        Row: {
          account_code: string | null
          account_id: string
          created_at: string
          credit: number | null
          date: string | null
          debit: number | null
          description: string | null
          id: string
          item_created_at: string | null
          journal_entry_id: string
          normal_balance: string | null
          period: string | null
          updated_at: string
        }
        Insert: {
          account_code?: string | null
          account_id: string
          created_at?: string
          credit?: number | null
          date?: string | null
          debit?: number | null
          description?: string | null
          id?: string
          item_created_at?: string | null
          journal_entry_id: string
          normal_balance?: string | null
          period?: string | null
          updated_at?: string
        }
        Update: {
          account_code?: string | null
          account_id?: string
          created_at?: string
          credit?: number | null
          date?: string | null
          debit?: number | null
          description?: string | null
          id?: string
          item_created_at?: string | null
          journal_entry_id?: string
          normal_balance?: string | null
          period?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_items_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_items_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_items_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries_with_bookings"
            referencedColumns: ["journal_entry_id"]
          },
        ]
      }
      journal_entry_status_changes: {
        Row: {
          changed_at: string | null
          id: string
          journal_entry_id: string | null
          new_status: string | null
          old_status: string | null
        }
        Insert: {
          changed_at?: string | null
          id?: string
          journal_entry_id?: string | null
          new_status?: string | null
          old_status?: string | null
        }
        Update: {
          changed_at?: string | null
          id?: string
          journal_entry_id?: string | null
          new_status?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_status_changes_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_status_changes_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries_with_bookings"
            referencedColumns: ["journal_entry_id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string | null
          employee_id: string | null
          end_date: string
          id: string
          leave_type: string
          reason: string
          start_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          end_date: string
          id?: string
          leave_type: string
          reason: string
          start_date: string
          status: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_summaries: {
        Row: {
          account_code: string
          account_name: string
          closing_balance: number | null
          ending_balance: number | null
          id: string
          item_created_at: string | null
          normal_balance: string | null
          opening_balance: number | null
          period: string
          total_credit: number | null
          total_debit: number | null
        }
        Insert: {
          account_code: string
          account_name: string
          closing_balance?: number | null
          ending_balance?: number | null
          id?: string
          item_created_at?: string | null
          normal_balance?: string | null
          opening_balance?: number | null
          period: string
          total_credit?: number | null
          total_debit?: number | null
        }
        Update: {
          account_code?: string
          account_name?: string
          closing_balance?: number | null
          ending_balance?: number | null
          id?: string
          item_created_at?: string | null
          normal_balance?: string | null
          opening_balance?: number | null
          period?: string
          total_credit?: number | null
          total_debit?: number | null
        }
        Relationships: []
      }
      modules: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      mutasi_rek_mandiri_ciputat: {
        Row: {
          akun: string | null
          balance: number | null
          credit: number | null
          "date & time": string
          debit: number | null
          deskripsi: string | null
          id: number
          "kas bank": string | null
          ket: string | null
          null: string | null
          pic: string | null
          pos: string | null
          pp: string | null
          "sub akun": string | null
        }
        Insert: {
          akun?: string | null
          balance?: number | null
          credit?: number | null
          "date & time": string
          debit?: number | null
          deskripsi?: string | null
          id?: number
          "kas bank"?: string | null
          ket?: string | null
          null?: string | null
          pic?: string | null
          pos?: string | null
          pp?: string | null
          "sub akun"?: string | null
        }
        Update: {
          akun?: string | null
          balance?: number | null
          credit?: number | null
          "date & time"?: string
          debit?: number | null
          deskripsi?: string | null
          id?: number
          "kas bank"?: string | null
          ket?: string | null
          null?: string | null
          pic?: string | null
          pos?: string | null
          pp?: string | null
          "sub akun"?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          booking_id: string | null
          created_at: string | null
          driver_id: string | null
          id: string
          message: string
          metadata: Json | null
          payment_id: string | null
          read: boolean | null
          type: string
          user_id: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          driver_id?: string | null
          id?: string
          message: string
          metadata?: Json | null
          payment_id?: string | null
          read?: boolean | null
          type: string
          user_id?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          driver_id?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          payment_id?: string | null
          read?: boolean | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "journal_entries_with_bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "notifications_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          created_at: string | null
          id: string
          name: string
          npwp: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          npwp?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          npwp?: string | null
        }
        Relationships: []
      }
      paylabs_config: {
        Row: {
          created_at: string | null
          id: string
          merchant_id: string
          mode: string
          private_key: string
          public_key: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          merchant_id: string
          mode: string
          private_key: string
          public_key: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          merchant_id?: string
          mode?: string
          private_key?: string
          public_key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_bookings: {
        Row: {
          booking_id: string
          booking_type: string | null
          code_booking: string | null
          created_at: string | null
          id: string
          payment_id: string | null
        }
        Insert: {
          booking_id: string
          booking_type?: string | null
          code_booking?: string | null
          created_at?: string | null
          id?: string
          payment_id?: string | null
        }
        Update: {
          booking_id?: string
          booking_type?: string | null
          code_booking?: string | null
          created_at?: string | null
          id?: string
          payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_bookings_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          account_holder: string | null
          account_number: number | null
          bank_code: number | null
          bank_name: string | null
          branch: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          mode: string | null
          name: string
          payment_code: string | null
          provider: string | null
          swift_code: string | null
          type: string
        }
        Insert: {
          account_holder?: string | null
          account_number?: number | null
          bank_code?: number | null
          bank_name?: string | null
          branch?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          mode?: string | null
          name: string
          payment_code?: string | null
          provider?: string | null
          swift_code?: string | null
          type: string
        }
        Update: {
          account_holder?: string | null
          account_number?: number | null
          bank_code?: number | null
          bank_name?: string | null
          branch?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          mode?: string | null
          name?: string
          payment_code?: string | null
          provider?: string | null
          swift_code?: string | null
          type?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number | null
          amount_paid: number | null
          bank_account_id: string | null
          bank_name: string | null
          booking_id: string | null
          booking_ids: string | null
          bookings_status: string | null
          code_booking: string | null
          created_at: string | null
          driver_id: string | null
          due_date: string | null
          id: string
          is_damage_payment: boolean | null
          is_partial_payment: boolean | null
          journal_entry_id: string | null
          license_plate: string | null
          make: string | null
          model: string | null
          no_telepon: number | null
          notes: string | null
          paid_amount: number | null
          paylabs_transaction_id: string | null
          payment_date: string | null
          payment_method: string | null
          payment_method_id: string | null
          payment_status: string | null
          payment_url: string | null
          plate_number: string | null
          remaining_payments: number | null
          status: string | null
          total_amount: number | null
          transaction_id: string | null
          transaction_reference: string | null
          transfer_reference: number | null
          user_id: string | null
          va_number: string | null
        }
        Insert: {
          amount?: number | null
          amount_paid?: number | null
          bank_account_id?: string | null
          bank_name?: string | null
          booking_id?: string | null
          booking_ids?: string | null
          bookings_status?: string | null
          code_booking?: string | null
          created_at?: string | null
          driver_id?: string | null
          due_date?: string | null
          id?: string
          is_damage_payment?: boolean | null
          is_partial_payment?: boolean | null
          journal_entry_id?: string | null
          license_plate?: string | null
          make?: string | null
          model?: string | null
          no_telepon?: number | null
          notes?: string | null
          paid_amount?: number | null
          paylabs_transaction_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_method_id?: string | null
          payment_status?: string | null
          payment_url?: string | null
          plate_number?: string | null
          remaining_payments?: number | null
          status?: string | null
          total_amount?: number | null
          transaction_id?: string | null
          transaction_reference?: string | null
          transfer_reference?: number | null
          user_id?: string | null
          va_number?: string | null
        }
        Update: {
          amount?: number | null
          amount_paid?: number | null
          bank_account_id?: string | null
          bank_name?: string | null
          booking_id?: string | null
          booking_ids?: string | null
          bookings_status?: string | null
          code_booking?: string | null
          created_at?: string | null
          driver_id?: string | null
          due_date?: string | null
          id?: string
          is_damage_payment?: boolean | null
          is_partial_payment?: boolean | null
          journal_entry_id?: string | null
          license_plate?: string | null
          make?: string | null
          model?: string | null
          no_telepon?: number | null
          notes?: string | null
          paid_amount?: number | null
          paylabs_transaction_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_method_id?: string | null
          payment_status?: string | null
          payment_url?: string | null
          plate_number?: string | null
          remaining_payments?: number | null
          status?: string | null
          total_amount?: number | null
          transaction_id?: string | null
          transaction_reference?: string | null
          transfer_reference?: number | null
          user_id?: string | null
          va_number?: string | null
        }
        Relationships: []
      }
      pending_api_jobs: {
        Row: {
          created_at: string | null
          error: string | null
          id: number
          payload: Json
          response: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          id?: number
          payload: Json
          response?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          id?: number
          payload?: Json
          response?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          action_id: string
          allowed: boolean
          created_at: string | null
          id: string
          module_id: string
          role_id: string
          updated_at: string | null
        }
        Insert: {
          action_id: string
          allowed?: boolean
          created_at?: string | null
          id?: string
          module_id: string
          role_id: string
          updated_at?: string | null
        }
        Update: {
          action_id?: string
          allowed?: boolean
          created_at?: string | null
          id?: string
          module_id?: string
          role_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permissions_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permissions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      post_rental_inspections: {
        Row: {
          booking_id: string | null
          created_at: string | null
          damages: Json | null
          id: string
          notes: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          damages?: Json | null
          id?: string
          notes?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          damages?: Json | null
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_rental_inspections_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_rental_inspections_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "journal_entries_with_bookings"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      price_km: {
        Row: {
          basic_price: number
          created_at: string | null
          id: number
          is_active: boolean | null
          minimum_distance: number | null
          price_per_km: number
          surcharge: number
          updated_at: string | null
          vehicle_type: string
        }
        Insert: {
          basic_price?: number
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          minimum_distance?: number | null
          price_per_km?: number
          surcharge?: number
          updated_at?: string | null
          vehicle_type: string
        }
        Update: {
          basic_price?: number
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          minimum_distance?: number | null
          price_per_km?: number
          surcharge?: number
          updated_at?: string | null
          vehicle_type?: string
        }
        Relationships: []
      }
      profit_loss_reports: {
        Row: {
          created_at: string | null
          generated_by: string | null
          id: string
          net_profit: number
          period_end: string
          period_start: string
          report_date: string
          total_expenses: number
          total_revenue: number
        }
        Insert: {
          created_at?: string | null
          generated_by?: string | null
          id?: string
          net_profit?: number
          period_end: string
          period_start: string
          report_date: string
          total_expenses?: number
          total_revenue?: number
        }
        Update: {
          created_at?: string | null
          generated_by?: string | null
          id?: string
          net_profit?: number
          period_end?: string
          period_start?: string
          report_date?: string
          total_expenses?: number
          total_revenue?: number
        }
        Relationships: [
          {
            foreignKeyName: "profit_loss_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "agent_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profit_loss_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      remaining_payments: {
        Row: {
          booking_id: string | null
          created_at: string | null
          id: string
          paid_amount: number | null
          payment_id: string | null
          remaining_amount: number | null
          total_amount: number | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          paid_amount?: number | null
          payment_id?: string | null
          remaining_amount?: number | null
          total_amount?: number | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          paid_amount?: number | null
          payment_id?: string | null
          remaining_amount?: number | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "journal_entries_with_bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_remaining_to_payments"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          description: string | null
          id: string | null
          role_id: number
          role_name: string | null
        }
        Insert: {
          description?: string | null
          id?: string | null
          role_id?: number
          role_name?: string | null
        }
        Update: {
          description?: string | null
          id?: string | null
          role_id?: number
          role_name?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          coa_id: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          coa_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          coa_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      services_id: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      shift_assignments: {
        Row: {
          created_at: string | null
          employee_id: string | null
          id: string
          shift_id: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          shift_id?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          shift_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          branch: string
          capacity: number
          created_at: string | null
          date: string
          end_time: string
          id: string
          is_recurring: boolean | null
          name: string
          recurring_days: string[] | null
          recurring_end_date: string | null
          recurring_frequency: string | null
          start_time: string
          status: string
          updated_at: string | null
        }
        Insert: {
          branch: string
          capacity: number
          created_at?: string | null
          date: string
          end_time: string
          id?: string
          is_recurring?: boolean | null
          name: string
          recurring_days?: string[] | null
          recurring_end_date?: string | null
          recurring_frequency?: string | null
          start_time: string
          status: string
          updated_at?: string | null
        }
        Update: {
          branch?: string
          capacity?: number
          created_at?: string | null
          date?: string
          end_time?: string
          id?: string
          is_recurring?: boolean | null
          name?: string
          recurring_days?: string[] | null
          recurring_end_date?: string | null
          recurring_frequency?: string | null
          start_time?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      shopping_cart: {
        Row: {
          booking_id: string | null
          code_booking: string | null
          created_at: string | null
          details: string | null
          id: string
          item_id: string | null
          item_type: string | null
          jumlah_penumpang: number | null
          payment_status: string | null
          price: number | null
          quantity: number
          service_name: string | null
          shopping_cart: string | null
          status: string | null
          status_cart: string | null
          user_id: string | null
        }
        Insert: {
          booking_id?: string | null
          code_booking?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          item_id?: string | null
          item_type?: string | null
          jumlah_penumpang?: number | null
          payment_status?: string | null
          price?: number | null
          quantity?: number
          service_name?: string | null
          shopping_cart?: string | null
          status?: string | null
          status_cart?: string | null
          user_id?: string | null
        }
        Update: {
          booking_id?: string | null
          code_booking?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          item_id?: string | null
          item_type?: string | null
          jumlah_penumpang?: number | null
          payment_status?: string | null
          price?: number | null
          quantity?: number
          service_name?: string | null
          shopping_cart?: string | null
          status?: string | null
          status_cart?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sports_facilities: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          price_per_hour: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price_per_hour?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price_per_hour?: number | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          address: string | null
          alamat: string | null
          created_at: string | null
          department: string | null
          email: string
          employee_id: string | null
          ethnicity: string | null
          family_phone_number: string | null
          first_name: string | null
          full_name: string | null
          id: string
          id_card_url: string | null
          kk_url: string | null
          ktp_number: string | null
          ktp_url: string | null
          last_name: string | null
          license_number: string | null
          name: string
          phone: string
          position: string | null
          religion: string | null
          role: string | null
          role_id: number | null
          selfie_url: string | null
          sim_url: string | null
          skck_url: string | null
          tanggal_lahir: string | null
          tempat_lahir: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          alamat?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          employee_id?: string | null
          ethnicity?: string | null
          family_phone_number?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          id_card_url?: string | null
          kk_url?: string | null
          ktp_number?: string | null
          ktp_url?: string | null
          last_name?: string | null
          license_number?: string | null
          name: string
          phone: string
          position?: string | null
          religion?: string | null
          role?: string | null
          role_id?: number | null
          selfie_url?: string | null
          sim_url?: string | null
          skck_url?: string | null
          tanggal_lahir?: string | null
          tempat_lahir?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          alamat?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          employee_id?: string | null
          ethnicity?: string | null
          family_phone_number?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          id_card_url?: string | null
          kk_url?: string | null
          ktp_number?: string | null
          ktp_url?: string | null
          last_name?: string | null
          license_number?: string | null
          name?: string
          phone?: string
          position?: string | null
          religion?: string | null
          role?: string | null
          role_id?: number | null
          selfie_url?: string | null
          sim_url?: string | null
          skck_url?: string | null
          tanggal_lahir?: string | null
          tempat_lahir?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_staff_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "agent_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_staff_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_accounts: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      topup_requests: {
        Row: {
          amount: number
          bank_name: string | null
          created_at: string | null
          destination_account: string | null
          id: string
          method: string
          note: string | null
          proof_url: string | null
          reference_no: string | null
          sender_account: string | null
          sender_bank: string | null
          sender_name: string | null
          status: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          bank_name?: string | null
          created_at?: string | null
          destination_account?: string | null
          id?: string
          method?: string
          note?: string | null
          proof_url?: string | null
          reference_no?: string | null
          sender_account?: string | null
          sender_bank?: string | null
          sender_name?: string | null
          status?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          bank_name?: string | null
          created_at?: string | null
          destination_account?: string | null
          id?: string
          method?: string
          note?: string | null
          proof_url?: string | null
          reference_no?: string | null
          sender_account?: string | null
          sender_bank?: string | null
          sender_name?: string | null
          status?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      trial_balance: {
        Row: {
          account_code: string
          account_id: string | null
          account_name: string | null
          account_type: string | null
          amount: number
          balance: number | null
          created_at: string | null
          credit: number | null
          credit_balance: number | null
          debit: number | null
          debit_balance: number | null
          id: string
          net_balance: number | null
          period: string
          period_end: string | null
          period_start: string | null
          total_amount: number | null
          total_credit: number | null
          total_debit: number | null
          updated_at: string | null
        }
        Insert: {
          account_code: string
          account_id?: string | null
          account_name?: string | null
          account_type?: string | null
          amount?: number
          balance?: number | null
          created_at?: string | null
          credit?: number | null
          credit_balance?: number | null
          debit?: number | null
          debit_balance?: number | null
          id?: string
          net_balance?: number | null
          period?: string
          period_end?: string | null
          period_start?: string | null
          total_amount?: number | null
          total_credit?: number | null
          total_debit?: number | null
          updated_at?: string | null
        }
        Update: {
          account_code?: string
          account_id?: string | null
          account_name?: string | null
          account_type?: string | null
          amount?: number
          balance?: number | null
          created_at?: string | null
          credit?: number | null
          credit_balance?: number | null
          debit?: number | null
          debit_balance?: number | null
          id?: string
          net_balance?: number | null
          period?: string
          period_end?: string | null
          period_start?: string | null
          total_amount?: number | null
          total_credit?: number | null
          total_debit?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      umrah_group: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      umroh_bookings: {
        Row: {
          additional_notes: string | null
          booking_id: string
          category: string
          category_price: number | null
          code_booking: string | null
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          dropoff_area: string | null
          flight_number: string
          group_size: number | null
          id: string
          passenger_area: string | null
          payment_id: string | null
          payment_method: string | null
          payment_status: string | null
          pickup_area: string | null
          pickup_date: string
          pickup_time: string
          service_price: number
          status: string | null
          total_price: number
          travel_type: string
          umroh_package: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          additional_notes?: string | null
          booking_id: string
          category: string
          category_price?: number | null
          code_booking?: string | null
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          dropoff_area?: string | null
          flight_number: string
          group_size?: number | null
          id?: string
          passenger_area?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          pickup_area?: string | null
          pickup_date: string
          pickup_time: string
          service_price: number
          status?: string | null
          total_price: number
          travel_type: string
          umroh_package?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          additional_notes?: string | null
          booking_id?: string
          category?: string
          category_price?: number | null
          code_booking?: string | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          dropoff_area?: string | null
          flight_number?: string
          group_size?: number | null
          id?: string
          passenger_area?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          pickup_area?: string | null
          pickup_date?: string
          pickup_time?: string
          service_price?: number
          status?: string | null
          total_price?: number
          travel_type?: string
          umroh_package?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          address: string | null
          birth_date: string | null
          birth_place: string | null
          created_at: string | null
          cv_url: string | null
          department: string | null
          driver_type: string | null
          education: string | null
          email: string | null
          employee_id: string | null
          ethnicity: string | null
          family_card_url: string | null
          family_phone_number: string | null
          first_name: string | null
          foto_ktp: string | null
          fuel_type: string | null
          full_name: string | null
          id: string
          id_card_url: string | null
          kk_url: string | null
          ktp_address: string | null
          ktp_number: number | null
          ktp_url: string | null
          last_name: string | null
          license_expiry: string | null
          license_number: number | null
          license_plate: string | null
          license_rate: number | null
          nama_perusahaan: string | null
          phone: string | null
          phone_number: string | null
          position: string | null
          religion: string | null
          role: string | null
          role_id: number | null
          saldo: number | null
          selfie_photo_url: string | null
          selfie_url: string | null
          sim_url: string | null
          skck_url: string | null
          status: string | null
          stnk_url: string | null
          transmission: string | null
          updated_at: string | null
          vehicle_brand: string | null
          vehicle_category: string | null
          vehicle_color: string | null
          vehicle_model: string | null
          vehicle_name: string | null
          vehicle_photo_url: string | null
          vehicle_status: string | null
          vehicle_type: string | null
          vehicle_year: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          birth_place?: string | null
          created_at?: string | null
          cv_url?: string | null
          department?: string | null
          driver_type?: string | null
          education?: string | null
          email?: string | null
          employee_id?: string | null
          ethnicity?: string | null
          family_card_url?: string | null
          family_phone_number?: string | null
          first_name?: string | null
          foto_ktp?: string | null
          fuel_type?: string | null
          full_name?: string | null
          id: string
          id_card_url?: string | null
          kk_url?: string | null
          ktp_address?: string | null
          ktp_number?: number | null
          ktp_url?: string | null
          last_name?: string | null
          license_expiry?: string | null
          license_number?: number | null
          license_plate?: string | null
          license_rate?: number | null
          nama_perusahaan?: string | null
          phone?: string | null
          phone_number?: string | null
          position?: string | null
          religion?: string | null
          role?: string | null
          role_id?: number | null
          saldo?: number | null
          selfie_photo_url?: string | null
          selfie_url?: string | null
          sim_url?: string | null
          skck_url?: string | null
          status?: string | null
          stnk_url?: string | null
          transmission?: string | null
          updated_at?: string | null
          vehicle_brand?: string | null
          vehicle_category?: string | null
          vehicle_color?: string | null
          vehicle_model?: string | null
          vehicle_name?: string | null
          vehicle_photo_url?: string | null
          vehicle_status?: string | null
          vehicle_type?: string | null
          vehicle_year?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          birth_place?: string | null
          created_at?: string | null
          cv_url?: string | null
          department?: string | null
          driver_type?: string | null
          education?: string | null
          email?: string | null
          employee_id?: string | null
          ethnicity?: string | null
          family_card_url?: string | null
          family_phone_number?: string | null
          first_name?: string | null
          foto_ktp?: string | null
          fuel_type?: string | null
          full_name?: string | null
          id?: string
          id_card_url?: string | null
          kk_url?: string | null
          ktp_address?: string | null
          ktp_number?: number | null
          ktp_url?: string | null
          last_name?: string | null
          license_expiry?: string | null
          license_number?: number | null
          license_plate?: string | null
          license_rate?: number | null
          nama_perusahaan?: string | null
          phone?: string | null
          phone_number?: string | null
          position?: string | null
          religion?: string | null
          role?: string | null
          role_id?: number | null
          saldo?: number | null
          selfie_photo_url?: string | null
          selfie_url?: string | null
          sim_url?: string | null
          skck_url?: string | null
          status?: string | null
          stnk_url?: string | null
          transmission?: string | null
          updated_at?: string | null
          vehicle_brand?: string | null
          vehicle_category?: string | null
          vehicle_color?: string | null
          vehicle_model?: string | null
          vehicle_name?: string | null
          vehicle_photo_url?: string | null
          vehicle_status?: string | null
          vehicle_type?: string | null
          vehicle_year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_users_roles"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
        ]
      }
      users_locations: {
        Row: {
          device_id: string | null
          full_name: string | null
          id: string
          latitude: number | null
          longitude: number | null
          updated_at: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          device_id?: string | null
          full_name?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          device_id?: string | null
          full_name?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      vehicle_types: {
        Row: {
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          available: boolean | null
          basic_price: string | null
          category: string | null
          color: string | null
          created_at: string | null
          daily_rate: string | null
          driver_id: string | null
          features: Json | null
          fuel_type: string | null
          id: string
          image: string | null
          image_url: string | null
          is_active: boolean | null
          is_available: string | null
          is_booked: boolean | null
          is_with_driver: boolean | null
          license_plate: string | null
          make: string
          mileage: string | null
          model: string
          name: string | null
          plate_number: string | null
          price: number
          price_km: number | null
          seats: number | null
          sheet_row_index: number | null
          status: string | null
          stnk_expiry: string | null
          stnk_url: string | null
          surcharge: string | null
          tax_expiry: string | null
          transmission: string | null
          type: string | null
          updated_at: string | null
          vehicle_status: string | null
          vehicle_type_id: number | null
          year: number | null
        }
        Insert: {
          available?: boolean | null
          basic_price?: string | null
          category?: string | null
          color?: string | null
          created_at?: string | null
          daily_rate?: string | null
          driver_id?: string | null
          features?: Json | null
          fuel_type?: string | null
          id?: string
          image?: string | null
          image_url?: string | null
          is_active?: boolean | null
          is_available?: string | null
          is_booked?: boolean | null
          is_with_driver?: boolean | null
          license_plate?: string | null
          make: string
          mileage?: string | null
          model: string
          name?: string | null
          plate_number?: string | null
          price: number
          price_km?: number | null
          seats?: number | null
          sheet_row_index?: number | null
          status?: string | null
          stnk_expiry?: string | null
          stnk_url?: string | null
          surcharge?: string | null
          tax_expiry?: string | null
          transmission?: string | null
          type?: string | null
          updated_at?: string | null
          vehicle_status?: string | null
          vehicle_type_id?: number | null
          year?: number | null
        }
        Update: {
          available?: boolean | null
          basic_price?: string | null
          category?: string | null
          color?: string | null
          created_at?: string | null
          daily_rate?: string | null
          driver_id?: string | null
          features?: Json | null
          fuel_type?: string | null
          id?: string
          image?: string | null
          image_url?: string | null
          is_active?: boolean | null
          is_available?: string | null
          is_booked?: boolean | null
          is_with_driver?: boolean | null
          license_plate?: string | null
          make?: string
          mileage?: string | null
          model?: string
          name?: string | null
          plate_number?: string | null
          price?: number
          price_km?: number | null
          seats?: number | null
          sheet_row_index?: number | null
          status?: string | null
          stnk_expiry?: string | null
          stnk_url?: string | null
          surcharge?: string | null
          tax_expiry?: string | null
          transmission?: string | null
          type?: string | null
          updated_at?: string | null
          vehicle_status?: string | null
          vehicle_type_id?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_vehicle_type_id_fkey"
            columns: ["vehicle_type_id"]
            isOneToOne: false
            referencedRelation: "vehicle_types"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_ledger: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string | null
          direction: string
          entry_type: string
          id: string
          ref_id: string | null
          ref_table: string | null
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string | null
          direction: string
          entry_type: string
          id?: string
          ref_id?: string | null
          ref_table?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string | null
          direction?: string
          entry_type?: string
          id?: string
          ref_id?: string | null
          ref_table?: string | null
          user_id?: string
        }
        Relationships: []
      }
      work_areas: {
        Row: {
          city_id: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          city_id: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          city_id?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_areas_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      work_places: {
        Row: {
          created_at: string | null
          id: string
          name: string
          work_area_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          work_area_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          work_area_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_places_work_area_id_fkey"
            columns: ["work_area_id"]
            isOneToOne: false
            referencedRelation: "work_areas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      agent_monthly_summary: {
        Row: {
          bulan: string | null
          harga_per_orang: number | null
          total_penumpang: number | null
          total_tagihan: number | null
          user_id: string | null
        }
        Relationships: []
      }
      agent_users: {
        Row: {
          created_at: string | null
          education: string | null
          email: string | null
          full_name: string | null
          id: string | null
          ktp_number: number | null
          license_number: number | null
          phone_number: string | null
          role: string | null
          role_id: number | null
          saldo: number | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          education?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          ktp_number?: number | null
          license_number?: number | null
          phone_number?: string | null
          role?: string | null
          role_id?: number | null
          saldo?: number | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          education?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          ktp_number?: number | null
          license_number?: number | null
          phone_number?: string | null
          role?: string | null
          role_id?: number | null
          saldo?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_users_roles"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
        ]
      }
      bookings_trips_with_user: {
        Row: {
          additional_data: string | null
          bank_account: string | null
          created_at: string | null
          driver_name: string | null
          fee_sales: number | null
          harga_basic: number | null
          harga_jual: number | null
          id: string | null
          jam_checkin: string | null
          jam_checkout: string | null
          jenis_kendaraan: string | null
          jumlah_hari: number | null
          jumlah_kamar: number | null
          jumlah_malam: number | null
          keterangan: string | null
          kode_booking: string | null
          license_plate: string | null
          lokasi: string | null
          lokasi_hotel: string | null
          nama_penumpang: string | null
          no_telepon: number | null
          nomor_plat: string | null
          payment_method: string | null
          price: number | null
          profit: number | null
          quantity: number | null
          service_details: string | null
          service_name: string | null
          service_type: string | null
          status: string | null
          tanggal: string | null
          tanggal_checkin: string | null
          tanggal_checkout: string | null
          total_amount: number | null
          tujuan: string | null
          type_unit: string | null
          user_email: string | null
          user_full_name: string | null
          user_id: string | null
          user_role: string | null
        }
        Relationships: []
      }
      general_ledger_with_running_balance: {
        Row: {
          running_balance: number | null
        }
        Relationships: []
      }
      general_ledger_with_type: {
        Row: {
          account_code: string | null
          account_id: string | null
          account_name: string | null
          account_type: string | null
          balance: number | null
          booking_id: string | null
          created_at: string | null
          credit: number | null
          date: string | null
          debit: number | null
          description: string | null
          entry_type: string | null
          id: string | null
          is_manual_entry: string | null
          journal_entry_id: string | null
          journal_entry_item_id: string | null
          manual_entry: boolean | null
          normal_balance: string | null
          payment_id: string | null
          period_month: string | null
          reference_number: string | null
          running_balance: number | null
          total_credit: number | null
          total_debit: number | null
          transaction_date: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_general_ledger_journal_entry_item"
            columns: ["journal_entry_item_id"]
            isOneToOne: false
            referencedRelation: "journal_entry_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_general_ledger_journal_entry_item"
            columns: ["journal_entry_item_id"]
            isOneToOne: false
            referencedRelation: "journal_entry_items_with_ledger"
            referencedColumns: ["journal_entry_item_id"]
          },
          {
            foreignKeyName: "general_ledger_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "general_ledger_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "general_ledger_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries_with_bookings"
            referencedColumns: ["journal_entry_id"]
          },
        ]
      }
      journal_entries_with_bookings: {
        Row: {
          booking_amount: number | null
          booking_created_at: string | null
          booking_id: string | null
          description: string | null
          entry_date: string | null
          entry_type: string | null
          journal_entry_id: string | null
          payment_status: string | null
          reference_number: string | null
          total_amount: number | null
          vehicle_name: string | null
        }
        Relationships: []
      }
      journal_entry_items_with_ledger: {
        Row: {
          account_id: string | null
          general_ledger_id: string | null
          item_created_at: string | null
          item_credit: number | null
          item_debit: number | null
          item_updated_at: string | null
          journal_entry_id: string | null
          journal_entry_item_id: string | null
          ledger_created_at: string | null
          ledger_credit: number | null
          ledger_date: string | null
          ledger_debit: number | null
          ledger_description: string | null
          ledger_updated_at: string | null
          manual_entry: boolean | null
          running_balance: number | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_items_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_items_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_items_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries_with_bookings"
            referencedColumns: ["journal_entry_id"]
          },
        ]
      }
      payment_debug_logs: {
        Row: {
          created_at: string | null
          data: Json | null
          id: number | null
          message: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: number | null
          message?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: number | null
          message?: string | null
        }
        Relationships: []
      }
      profit_loss_summary_view: {
        Row: {
          account_code: string | null
          account_name: string | null
          account_type: string | null
          net_amount: number | null
          period: string | null
          total_credit: number | null
          total_debit: number | null
        }
        Relationships: []
      }
      profit_loss_view: {
        Row: {
          account_code: string | null
          account_name: string | null
          account_type: string | null
          net_value: number | null
          total_credit: number | null
          total_debit: number | null
          transaction_date: string | null
        }
        Relationships: []
      }
      trial_balance_view: {
        Row: {
          account_code: string | null
          account_name: string | null
          closing_balance: number | null
          credit: number | null
          debit: number | null
        }
        Relationships: []
      }
      v_topup_requests: {
        Row: {
          agent_email: string | null
          agent_full_name: string | null
          amount: number | null
          bank_name: string | null
          created_at: string | null
          destination_account: string | null
          id: string | null
          method: string | null
          note: string | null
          proof_url: string | null
          reference_no: string | null
          sender_account: string | null
          sender_bank: string | null
          sender_name: string | null
          status: string | null
          user_id: string | null
          verified_at: string | null
          verified_by: string | null
          verifier_email: string | null
          verifier_full_name: string | null
        }
        Relationships: []
      }
      view_total_kas: {
        Row: {
          account_code: string | null
          account_name: string | null
          total_balance: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      auto_post_jurnal_from_mutasi: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      close_period: {
        Args: { p_period: string }
        Returns: undefined
      }
      contoh_fungsi: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_general_ledger_entry: {
        Args: {
          p_account_id: string
          p_debit: number
          p_credit: number
          p_description: string
        }
        Returns: undefined
      }
      generate_balance_sheet: {
        Args: { p_period: string }
        Returns: {
          total_assets: number
          total_liabilities: number
          total_equity: number
          is_balanced: boolean
        }[]
      }
      generate_ledger_summary: {
        Args: { p_period: string }
        Returns: undefined
      }
      generate_profit_loss: {
        Args:
          | { p_period: string }
          | {
              p_start_date: string
              p_end_date: string
              p_generated_by?: string
            }
        Returns: undefined
      }
      get_account_id_from_service: {
        Args: { service: string }
        Returns: string
      }
      get_table_info: {
        Args: { table_name: string }
        Returns: {
          column_name: string
          data_type: string
          is_nullable: string
        }[]
      }
      get_tables: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
        }[]
      }
      get_trial_balance_summary: {
        Args: { p_period_start: string; p_period_end: string }
        Returns: {
          total_debit: number
          total_credit: number
          is_balanced: boolean
          record_count: number
          gl_total_debit: number
          gl_total_credit: number
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      my_function: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      populate_trial_balance: {
        Args: { p_period_start: string; p_period_end: string }
        Returns: undefined
      }
      process_journal_entry: {
        Args: { p_journal_entry_id: string }
        Returns: undefined
      }
      recalculate_all_balances: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      reject_topup: {
        Args:
          | { p_request_id: string; p_admin: string; p_reason: string }
          | { p_request_id: string; p_reason: string }
        Returns: undefined
      }
      sync_trial_balance_with_gl: {
        Args: { p_period_start: string; p_period_end: string }
        Returns: {
          synced_accounts: number
          total_debit: number
          total_credit: number
        }[]
      }
      test_user_insert: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_account_balance: {
        Args: {
          p_account_id: string
          p_debit_amount?: number
          p_credit_amount?: number
        }
        Returns: boolean
      }
      update_all_account_totals: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      update_coa_balance: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      upsert_ledger_summaries: {
        Args: { payload: Json } | { payload: string }
        Returns: undefined
      }
      upsert_trial_balance_for_period: {
        Args: { p_period: string }
        Returns: undefined
      }
      upsert_trial_balance_from_json: {
        Args: { payload: Json }
        Returns: undefined
      }
      upsert_trial_balance_from_ledger: {
        Args: { payload: string }
        Returns: undefined
      }
      upsert_trial_balances: {
        Args:
          | { account_id: string; period: string; amount: number }
          | { payload: string }
        Returns: undefined
      }
      verify_topup: {
        Args: { p_request_id: string; p_note?: string }
        Returns: undefined
      }
    }
    Enums: {
      transfer_status: "pending" | "confirmed" | "completed" | "canceled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      transfer_status: ["pending", "confirmed", "completed", "canceled"],
    },
  },
} as const
