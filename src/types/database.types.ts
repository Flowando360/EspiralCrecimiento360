export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      acuerdos_crecimiento: {
        Row: {
          compromisos_colaborador: string | null
          compromisos_empresa: string | null
          created_at: string
          evaluacion_id: string
          fecha_firma_colaborador: string | null
          fecha_firma_lider: string | null
          firmado_colaborador: boolean
          firmado_lider: boolean
          id: string
        }
        Insert: {
          compromisos_colaborador?: string | null
          compromisos_empresa?: string | null
          created_at?: string
          evaluacion_id: string
          fecha_firma_colaborador?: string | null
          fecha_firma_lider?: string | null
          firmado_colaborador?: boolean
          firmado_lider?: boolean
          id?: string
        }
        Update: {
          compromisos_colaborador?: string | null
          compromisos_empresa?: string | null
          created_at?: string
          evaluacion_id?: string
          fecha_firma_colaborador?: string | null
          fecha_firma_lider?: string | null
          firmado_colaborador?: boolean
          firmado_lider?: boolean
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acuerdos_crecimiento_evaluacion_id_fkey"
            columns: ["evaluacion_id"]
            isOneToOne: false
            referencedRelation: "evaluaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      alertas: {
        Row: {
          ciclo_evaluacion_id: string | null
          colaborador_id: string | null
          created_at: string
          descripcion: string | null
          dias_anticipacion: number
          dotacion_entrega_id: string | null
          empresa_id: string
          estado: Database["public"]["Enums"]["estado_alerta"]
          fecha_especial_id: string | null
          fecha_objetivo: string
          hoja_vida_formacion_id: string | null
          id: string
          nexa_ruta_formacion_disparada_id: string | null
          resuelta_en: string | null
          resuelta_por: string | null
          severidad: Database["public"]["Enums"]["severidad_alerta"]
          tipo: Database["public"]["Enums"]["tipo_alerta"]
          titulo: string
        }
        Insert: {
          ciclo_evaluacion_id?: string | null
          colaborador_id?: string | null
          created_at?: string
          descripcion?: string | null
          dias_anticipacion?: number
          dotacion_entrega_id?: string | null
          empresa_id: string
          estado?: Database["public"]["Enums"]["estado_alerta"]
          fecha_especial_id?: string | null
          fecha_objetivo: string
          hoja_vida_formacion_id?: string | null
          id?: string
          nexa_ruta_formacion_disparada_id?: string | null
          resuelta_en?: string | null
          resuelta_por?: string | null
          severidad?: Database["public"]["Enums"]["severidad_alerta"]
          tipo: Database["public"]["Enums"]["tipo_alerta"]
          titulo: string
        }
        Update: {
          ciclo_evaluacion_id?: string | null
          colaborador_id?: string | null
          created_at?: string
          descripcion?: string | null
          dias_anticipacion?: number
          dotacion_entrega_id?: string | null
          empresa_id?: string
          estado?: Database["public"]["Enums"]["estado_alerta"]
          fecha_especial_id?: string | null
          fecha_objetivo?: string
          hoja_vida_formacion_id?: string | null
          id?: string
          nexa_ruta_formacion_disparada_id?: string | null
          resuelta_en?: string | null
          resuelta_por?: string | null
          severidad?: Database["public"]["Enums"]["severidad_alerta"]
          tipo?: Database["public"]["Enums"]["tipo_alerta"]
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "alertas_ciclo_evaluacion_id_fkey"
            columns: ["ciclo_evaluacion_id"]
            isOneToOne: false
            referencedRelation: "ciclos_evaluacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "alertas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "alertas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "alertas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "alertas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "alertas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "alertas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
          {
            foreignKeyName: "alertas_dotacion_entrega_id_fkey"
            columns: ["dotacion_entrega_id"]
            isOneToOne: false
            referencedRelation: "dotacion_entregas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_fecha_especial_id_fkey"
            columns: ["fecha_especial_id"]
            isOneToOne: false
            referencedRelation: "fechas_especiales_colaborador"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_hoja_vida_formacion_id_fkey"
            columns: ["hoja_vida_formacion_id"]
            isOneToOne: false
            referencedRelation: "hoja_vida_formacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_resuelta_por_fkey"
            columns: ["resuelta_por"]
            isOneToOne: false
            referencedRelation: "perfiles_usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_alertas_nexa_ruta"
            columns: ["nexa_ruta_formacion_disparada_id"]
            isOneToOne: false
            referencedRelation: "nexa_rutas_formacion"
            referencedColumns: ["id"]
          },
        ]
      }
      briefs_retroalimentacion: {
        Row: {
          evaluacion_id: string
          generado_en: string
          id: string
          resumen_deber: string | null
          resumen_hacer: string | null
          sugerencias_enfoque: string | null
          talento_central: string | null
        }
        Insert: {
          evaluacion_id: string
          generado_en?: string
          id?: string
          resumen_deber?: string | null
          resumen_hacer?: string | null
          sugerencias_enfoque?: string | null
          talento_central?: string | null
        }
        Update: {
          evaluacion_id?: string
          generado_en?: string
          id?: string
          resumen_deber?: string | null
          resumen_hacer?: string | null
          sugerencias_enfoque?: string | null
          talento_central?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "briefs_retroalimentacion_evaluacion_id_fkey"
            columns: ["evaluacion_id"]
            isOneToOne: true
            referencedRelation: "evaluaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      candidatos: {
        Row: {
          correo: string | null
          created_at: string
          empresa_id: string
          hoja_vida_url: string | null
          id: string
          linkedin_url: string | null
          nombre_completo: string
          notas: string | null
          numero_documento: string | null
          origen: string
          telefono: string | null
        }
        Insert: {
          correo?: string | null
          created_at?: string
          empresa_id: string
          hoja_vida_url?: string | null
          id?: string
          linkedin_url?: string | null
          nombre_completo: string
          notas?: string | null
          numero_documento?: string | null
          origen?: string
          telefono?: string | null
        }
        Update: {
          correo?: string | null
          created_at?: string
          empresa_id?: string
          hoja_vida_url?: string | null
          id?: string
          linkedin_url?: string | null
          nombre_completo?: string
          notas?: string | null
          numero_documento?: string | null
          origen?: string
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidatos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      cargo_decisiones: {
        Row: {
          cargo_id: string
          descripcion: string
          id: string
          orden: number | null
          periodicidad: string | null
        }
        Insert: {
          cargo_id: string
          descripcion: string
          id?: string
          orden?: number | null
          periodicidad?: string | null
        }
        Update: {
          cargo_id?: string
          descripcion?: string
          id?: string
          orden?: number | null
          periodicidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cargo_decisiones_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
        ]
      }
      cargo_epp: {
        Row: {
          cargo_id: string
          id: string
          item: string
          orden: number | null
        }
        Insert: {
          cargo_id: string
          id?: string
          item: string
          orden?: number | null
        }
        Update: {
          cargo_id?: string
          id?: string
          item?: string
          orden?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cargo_epp_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
        ]
      }
      cargo_examenes_medicos: {
        Row: {
          cargo_id: string
          id: string
          momento: string
          nombre_examen: string
          orden: number | null
        }
        Insert: {
          cargo_id: string
          id?: string
          momento: string
          nombre_examen: string
          orden?: number | null
        }
        Update: {
          cargo_id?: string
          id?: string
          momento?: string
          nombre_examen?: string
          orden?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cargo_examenes_medicos_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
        ]
      }
      cargo_factores_riesgo: {
        Row: {
          cargo_id: string
          categoria: string | null
          efectos_posibles: string | null
          factor: string
          id: string
          orden: number | null
        }
        Insert: {
          cargo_id: string
          categoria?: string | null
          efectos_posibles?: string | null
          factor: string
          id?: string
          orden?: number | null
        }
        Update: {
          cargo_id?: string
          categoria?: string | null
          efectos_posibles?: string | null
          factor?: string
          id?: string
          orden?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cargo_factores_riesgo_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
        ]
      }
      cargo_funciones_principales: {
        Row: {
          cargo_id: string
          funcion: string
          herramientas: string | null
          id: string
          orden: number | null
          periodicidad: string | null
          proceso: string | null
          resultado_esperado: string | null
          tipo_phva: string | null
        }
        Insert: {
          cargo_id: string
          funcion: string
          herramientas?: string | null
          id?: string
          orden?: number | null
          periodicidad?: string | null
          proceso?: string | null
          resultado_esperado?: string | null
          tipo_phva?: string | null
        }
        Update: {
          cargo_id?: string
          funcion?: string
          herramientas?: string | null
          id?: string
          orden?: number | null
          periodicidad?: string | null
          proceso?: string | null
          resultado_esperado?: string | null
          tipo_phva?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cargo_funciones_principales_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
        ]
      }
      cargo_habilidades: {
        Row: {
          cargo_id: string
          id: string
          nivel_esperado: Database["public"]["Enums"]["nivel_esperado"]
          nombre: string
          orden: number | null
          tipo: Database["public"]["Enums"]["tipo_habilidad"]
        }
        Insert: {
          cargo_id: string
          id?: string
          nivel_esperado: Database["public"]["Enums"]["nivel_esperado"]
          nombre: string
          orden?: number | null
          tipo: Database["public"]["Enums"]["tipo_habilidad"]
        }
        Update: {
          cargo_id?: string
          id?: string
          nivel_esperado?: Database["public"]["Enums"]["nivel_esperado"]
          nombre?: string
          orden?: number | null
          tipo?: Database["public"]["Enums"]["tipo_habilidad"]
        }
        Relationships: [
          {
            foreignKeyName: "cargo_habilidades_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
        ]
      }
      cargo_items_evaluacion_excluidos: {
        Row: {
          cargo_funcion_id: string | null
          cargo_id: string
          competencia_id: string | null
          created_at: string
          id: string
        }
        Insert: {
          cargo_funcion_id?: string | null
          cargo_id: string
          competencia_id?: string | null
          created_at?: string
          id?: string
        }
        Update: {
          cargo_funcion_id?: string | null
          cargo_id?: string
          competencia_id?: string | null
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cargo_items_evaluacion_excluidos_cargo_funcion_id_fkey"
            columns: ["cargo_funcion_id"]
            isOneToOne: false
            referencedRelation: "cargo_funciones_principales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cargo_items_evaluacion_excluidos_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cargo_items_evaluacion_excluidos_competencia_id_fkey"
            columns: ["competencia_id"]
            isOneToOne: false
            referencedRelation: "competencias"
            referencedColumns: ["id"]
          },
        ]
      }
      cargos: {
        Row: {
          activo: boolean
          cambios_documentales: string | null
          cargos_a_los_que_reporta: string | null
          cargos_que_le_reportan: string | null
          codigo_documento: string | null
          competencias_cardinales: string | null
          created_at: string
          destreza_auditiva: boolean | null
          destreza_coordinacion_motora: boolean | null
          destreza_fisica: boolean | null
          destreza_manual: boolean | null
          destreza_visual: boolean | null
          documento_perfil_url: string | null
          edad_maxima: number | null
          edad_minima: number | null
          empresa_id: string
          experiencia_minima_meses: number | null
          fecha_documento: string | null
          formacion_minima_induccion: string | null
          formacion_nivel: string | null
          formacion_titulo_especifico: string | null
          genero_requerido: string | null
          id: string
          manejo_dinero: string | null
          nombre: string
          objetivo_cargo: string | null
          proceso_area: string | null
          recursos_seleccion: string | null
          responsabilidad_bienes_servicios:
            | Database["public"]["Enums"]["nivel_esperado"]
            | null
          responsabilidad_direccion_coordinacion:
            | Database["public"]["Enums"]["nivel_esperado"]
            | null
          responsabilidad_informacion:
            | Database["public"]["Enums"]["nivel_esperado"]
            | null
          responsabilidad_relaciones_interpersonales:
            | Database["public"]["Enums"]["nivel_esperado"]
            | null
          salario: string | null
          sgsst_autoridad: string | null
          sgsst_rendicion_cuentas: string | null
          sgsst_responsabilidades_campo: string | null
          sgsst_responsabilidades_generales: string | null
          tiene_personal_a_cargo: boolean
          tipo_area: string | null
          toma_decisiones_organizacionales: string | null
          updated_at: string
          version_documento: string | null
        }
        Insert: {
          activo?: boolean
          cambios_documentales?: string | null
          cargos_a_los_que_reporta?: string | null
          cargos_que_le_reportan?: string | null
          codigo_documento?: string | null
          competencias_cardinales?: string | null
          created_at?: string
          destreza_auditiva?: boolean | null
          destreza_coordinacion_motora?: boolean | null
          destreza_fisica?: boolean | null
          destreza_manual?: boolean | null
          destreza_visual?: boolean | null
          documento_perfil_url?: string | null
          edad_maxima?: number | null
          edad_minima?: number | null
          empresa_id: string
          experiencia_minima_meses?: number | null
          fecha_documento?: string | null
          formacion_minima_induccion?: string | null
          formacion_nivel?: string | null
          formacion_titulo_especifico?: string | null
          genero_requerido?: string | null
          id?: string
          manejo_dinero?: string | null
          nombre: string
          objetivo_cargo?: string | null
          proceso_area?: string | null
          recursos_seleccion?: string | null
          responsabilidad_bienes_servicios?:
            | Database["public"]["Enums"]["nivel_esperado"]
            | null
          responsabilidad_direccion_coordinacion?:
            | Database["public"]["Enums"]["nivel_esperado"]
            | null
          responsabilidad_informacion?:
            | Database["public"]["Enums"]["nivel_esperado"]
            | null
          responsabilidad_relaciones_interpersonales?:
            | Database["public"]["Enums"]["nivel_esperado"]
            | null
          salario?: string | null
          sgsst_autoridad?: string | null
          sgsst_rendicion_cuentas?: string | null
          sgsst_responsabilidades_campo?: string | null
          sgsst_responsabilidades_generales?: string | null
          tiene_personal_a_cargo?: boolean
          tipo_area?: string | null
          toma_decisiones_organizacionales?: string | null
          updated_at?: string
          version_documento?: string | null
        }
        Update: {
          activo?: boolean
          cambios_documentales?: string | null
          cargos_a_los_que_reporta?: string | null
          cargos_que_le_reportan?: string | null
          codigo_documento?: string | null
          competencias_cardinales?: string | null
          created_at?: string
          destreza_auditiva?: boolean | null
          destreza_coordinacion_motora?: boolean | null
          destreza_fisica?: boolean | null
          destreza_manual?: boolean | null
          destreza_visual?: boolean | null
          documento_perfil_url?: string | null
          edad_maxima?: number | null
          edad_minima?: number | null
          empresa_id?: string
          experiencia_minima_meses?: number | null
          fecha_documento?: string | null
          formacion_minima_induccion?: string | null
          formacion_nivel?: string | null
          formacion_titulo_especifico?: string | null
          genero_requerido?: string | null
          id?: string
          manejo_dinero?: string | null
          nombre?: string
          objetivo_cargo?: string | null
          proceso_area?: string | null
          recursos_seleccion?: string | null
          responsabilidad_bienes_servicios?:
            | Database["public"]["Enums"]["nivel_esperado"]
            | null
          responsabilidad_direccion_coordinacion?:
            | Database["public"]["Enums"]["nivel_esperado"]
            | null
          responsabilidad_informacion?:
            | Database["public"]["Enums"]["nivel_esperado"]
            | null
          responsabilidad_relaciones_interpersonales?:
            | Database["public"]["Enums"]["nivel_esperado"]
            | null
          salario?: string | null
          sgsst_autoridad?: string | null
          sgsst_rendicion_cuentas?: string | null
          sgsst_responsabilidades_campo?: string | null
          sgsst_responsabilidades_generales?: string | null
          tiene_personal_a_cargo?: boolean
          tipo_area?: string | null
          toma_decisiones_organizacionales?: string | null
          updated_at?: string
          version_documento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cargos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      casos_proceso: {
        Row: {
          created_at: string
          descripcion: string | null
          etapa_id: string
          fecha_limite: string | null
          id: string
          orden: number
          prioridad: string
          proceso_id: string
          responsable_id: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          etapa_id: string
          fecha_limite?: string | null
          id?: string
          orden?: number
          prioridad?: string
          proceso_id: string
          responsable_id?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          etapa_id?: string
          fecha_limite?: string | null
          id?: string
          orden?: number
          prioridad?: string
          proceso_id?: string
          responsable_id?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "casos_proceso_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "etapas_proceso"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casos_proceso_proceso_id_fkey"
            columns: ["proceso_id"]
            isOneToOne: false
            referencedRelation: "procesos_gestion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casos_proceso_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casos_proceso_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "casos_proceso_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "casos_proceso_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "casos_proceso_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "casos_proceso_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "casos_proceso_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "casos_proceso_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
        ]
      }
      checklist_cumplimiento: {
        Row: {
          created_at: string
          descripcion: string | null
          empresa_id: string
          estado: string
          evidencia_url: string | null
          fecha_verificacion: string
          id: string
          item: string
          marco_normativo: string
          observaciones: string | null
          responsable_id: string | null
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          empresa_id: string
          estado?: string
          evidencia_url?: string | null
          fecha_verificacion?: string
          id?: string
          item: string
          marco_normativo: string
          observaciones?: string | null
          responsable_id?: string | null
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          empresa_id?: string
          estado?: string
          evidencia_url?: string | null
          fecha_verificacion?: string
          id?: string
          item?: string
          marco_normativo?: string
          observaciones?: string | null
          responsable_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_cumplimiento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_cumplimiento_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_cumplimiento_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "checklist_cumplimiento_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "checklist_cumplimiento_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "checklist_cumplimiento_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "checklist_cumplimiento_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "checklist_cumplimiento_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "checklist_cumplimiento_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
        ]
      }
      ciclos_evaluacion: {
        Row: {
          created_at: string
          empresa_id: string
          estado: Database["public"]["Enums"]["estado_ciclo"]
          fecha_apertura: string
          fecha_cierre_respuestas: string
          fecha_publicacion: string | null
          id: string
          nombre: string
          peso_colaboradores_con_equipo: number
          peso_lider_con_equipo: number
          peso_lider_sin_equipo: number
          peso_pares_con_equipo: number
          peso_pares_sin_equipo: number
        }
        Insert: {
          created_at?: string
          empresa_id: string
          estado?: Database["public"]["Enums"]["estado_ciclo"]
          fecha_apertura: string
          fecha_cierre_respuestas: string
          fecha_publicacion?: string | null
          id?: string
          nombre: string
          peso_colaboradores_con_equipo?: number
          peso_lider_con_equipo?: number
          peso_lider_sin_equipo?: number
          peso_pares_con_equipo?: number
          peso_pares_sin_equipo?: number
        }
        Update: {
          created_at?: string
          empresa_id?: string
          estado?: Database["public"]["Enums"]["estado_ciclo"]
          fecha_apertura?: string
          fecha_cierre_respuestas?: string
          fecha_publicacion?: string | null
          id?: string
          nombre?: string
          peso_colaboradores_con_equipo?: number
          peso_lider_con_equipo?: number
          peso_lider_sin_equipo?: number
          peso_pares_con_equipo?: number
          peso_pares_sin_equipo?: number
        }
        Relationships: [
          {
            foreignKeyName: "ciclos_evaluacion_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      clima_participaciones: {
        Row: {
          colaborador_id: string
          created_at: string
          id: string
          ronda_id: string
        }
        Insert: {
          colaborador_id: string
          created_at?: string
          id?: string
          ronda_id: string
        }
        Update: {
          colaborador_id?: string
          created_at?: string
          id?: string
          ronda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clima_participaciones_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clima_participaciones_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "clima_participaciones_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "clima_participaciones_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "clima_participaciones_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "clima_participaciones_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "clima_participaciones_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "clima_participaciones_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
          {
            foreignKeyName: "clima_participaciones_ronda_id_fkey"
            columns: ["ronda_id"]
            isOneToOne: false
            referencedRelation: "clima_rondas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clima_participaciones_ronda_id_fkey"
            columns: ["ronda_id"]
            isOneToOne: false
            referencedRelation: "v_clima_ronda_resumen"
            referencedColumns: ["ronda_id"]
          },
        ]
      }
      clima_respuestas: {
        Row: {
          comentario: string | null
          comunicacion: number
          condiciones: number
          created_at: string
          desarrollo: number
          enps: number
          equipo_lider_id: string | null
          id: string
          liderazgo: number
          pertenencia: number
          reconocimiento: number
          ronda_id: string
        }
        Insert: {
          comentario?: string | null
          comunicacion: number
          condiciones: number
          created_at?: string
          desarrollo: number
          enps: number
          equipo_lider_id?: string | null
          id?: string
          liderazgo: number
          pertenencia: number
          reconocimiento: number
          ronda_id: string
        }
        Update: {
          comentario?: string | null
          comunicacion?: number
          condiciones?: number
          created_at?: string
          desarrollo?: number
          enps?: number
          equipo_lider_id?: string | null
          id?: string
          liderazgo?: number
          pertenencia?: number
          reconocimiento?: number
          ronda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clima_respuestas_equipo_lider_id_fkey"
            columns: ["equipo_lider_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clima_respuestas_equipo_lider_id_fkey"
            columns: ["equipo_lider_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "clima_respuestas_equipo_lider_id_fkey"
            columns: ["equipo_lider_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "clima_respuestas_equipo_lider_id_fkey"
            columns: ["equipo_lider_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "clima_respuestas_equipo_lider_id_fkey"
            columns: ["equipo_lider_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "clima_respuestas_equipo_lider_id_fkey"
            columns: ["equipo_lider_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "clima_respuestas_equipo_lider_id_fkey"
            columns: ["equipo_lider_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "clima_respuestas_equipo_lider_id_fkey"
            columns: ["equipo_lider_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
          {
            foreignKeyName: "clima_respuestas_ronda_id_fkey"
            columns: ["ronda_id"]
            isOneToOne: false
            referencedRelation: "clima_rondas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clima_respuestas_ronda_id_fkey"
            columns: ["ronda_id"]
            isOneToOne: false
            referencedRelation: "v_clima_ronda_resumen"
            referencedColumns: ["ronda_id"]
          },
        ]
      }
      clima_rondas: {
        Row: {
          creada_por: string | null
          created_at: string
          empresa_id: string
          estado: Database["public"]["Enums"]["estado_ronda_clima"]
          fecha_apertura: string
          fecha_cierre: string | null
          id: string
          nombre: string
        }
        Insert: {
          creada_por?: string | null
          created_at?: string
          empresa_id: string
          estado?: Database["public"]["Enums"]["estado_ronda_clima"]
          fecha_apertura?: string
          fecha_cierre?: string | null
          id?: string
          nombre: string
        }
        Update: {
          creada_por?: string | null
          created_at?: string
          empresa_id?: string
          estado?: Database["public"]["Enums"]["estado_ronda_clima"]
          fecha_apertura?: string
          fecha_cierre?: string | null
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "clima_rondas_creada_por_fkey"
            columns: ["creada_por"]
            isOneToOne: false
            referencedRelation: "perfiles_usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clima_rondas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      colaborador_induccion_items: {
        Row: {
          asignado_en: string
          colaborador_id: string
          completado: boolean
          completado_en: string | null
          completado_por: string | null
          id: string
          item_id: string
          notas: string | null
        }
        Insert: {
          asignado_en?: string
          colaborador_id: string
          completado?: boolean
          completado_en?: string | null
          completado_por?: string | null
          id?: string
          item_id: string
          notas?: string | null
        }
        Update: {
          asignado_en?: string
          colaborador_id?: string
          completado?: boolean
          completado_en?: string | null
          completado_por?: string | null
          id?: string
          item_id?: string
          notas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaborador_induccion_items_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaborador_induccion_items_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "colaborador_induccion_items_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "colaborador_induccion_items_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "colaborador_induccion_items_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "colaborador_induccion_items_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "colaborador_induccion_items_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "colaborador_induccion_items_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
          {
            foreignKeyName: "colaborador_induccion_items_completado_por_fkey"
            columns: ["completado_por"]
            isOneToOne: false
            referencedRelation: "perfiles_usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaborador_induccion_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "induccion_items"
            referencedColumns: ["id"]
          },
        ]
      }
      colaboradores: {
        Row: {
          afp: string | null
          arl: string | null
          caja_compensacion: string | null
          cargo_id: string
          contrato_url: string | null
          created_at: string
          email: string | null
          empresa_id: string
          eps: string | null
          es_externo: boolean
          estado: Database["public"]["Enums"]["estado_colaborador"]
          fecha_ingreso: string
          fecha_salida: string | null
          foto_url: string | null
          hoja_vida_url: string | null
          id: string
          lider_id: string | null
          motivo_salida: string | null
          nombre_completo: string
          numero_documento: string | null
          salario: number | null
          telefono: string | null
          tipo_contrato: Database["public"]["Enums"]["tipo_contrato"]
          updated_at: string
          usuario_id: string | null
        }
        Insert: {
          afp?: string | null
          arl?: string | null
          caja_compensacion?: string | null
          cargo_id: string
          contrato_url?: string | null
          created_at?: string
          email?: string | null
          empresa_id: string
          eps?: string | null
          es_externo?: boolean
          estado?: Database["public"]["Enums"]["estado_colaborador"]
          fecha_ingreso: string
          fecha_salida?: string | null
          foto_url?: string | null
          hoja_vida_url?: string | null
          id?: string
          lider_id?: string | null
          motivo_salida?: string | null
          nombre_completo: string
          numero_documento?: string | null
          salario?: number | null
          telefono?: string | null
          tipo_contrato?: Database["public"]["Enums"]["tipo_contrato"]
          updated_at?: string
          usuario_id?: string | null
        }
        Update: {
          afp?: string | null
          arl?: string | null
          caja_compensacion?: string | null
          cargo_id?: string
          contrato_url?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string
          eps?: string | null
          es_externo?: boolean
          estado?: Database["public"]["Enums"]["estado_colaborador"]
          fecha_ingreso?: string
          fecha_salida?: string | null
          foto_url?: string | null
          hoja_vida_url?: string | null
          id?: string
          lider_id?: string | null
          motivo_salida?: string | null
          nombre_completo?: string
          numero_documento?: string | null
          salario?: number | null
          telefono?: string | null
          tipo_contrato?: Database["public"]["Enums"]["tipo_contrato"]
          updated_at?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaboradores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaboradores_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaboradores_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "colaboradores_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "colaboradores_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "colaboradores_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "colaboradores_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "colaboradores_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "colaboradores_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
          {
            foreignKeyName: "colaboradores_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      competencia_criterios: {
        Row: {
          competencia_id: string
          criterio: string
          id: string
          nivel: number
        }
        Insert: {
          competencia_id: string
          criterio: string
          id?: string
          nivel: number
        }
        Update: {
          competencia_id?: string
          criterio?: string
          id?: string
          nivel?: number
        }
        Relationships: [
          {
            foreignKeyName: "competencia_criterios_competencia_id_fkey"
            columns: ["competencia_id"]
            isOneToOne: false
            referencedRelation: "competencias"
            referencedColumns: ["id"]
          },
        ]
      }
      competencias: {
        Row: {
          activo: boolean
          bloque: Database["public"]["Enums"]["bloque_evaluacion"] | null
          descripcion_que_evalua: string | null
          dimension: Database["public"]["Enums"]["dimension_competencia"]
          empresa_id: string
          id: string
          nombre: string
          orden: number | null
          peso_relativo: number
          solo_con_personal_a_cargo: boolean
        }
        Insert: {
          activo?: boolean
          bloque?: Database["public"]["Enums"]["bloque_evaluacion"] | null
          descripcion_que_evalua?: string | null
          dimension: Database["public"]["Enums"]["dimension_competencia"]
          empresa_id: string
          id?: string
          nombre: string
          orden?: number | null
          peso_relativo?: number
          solo_con_personal_a_cargo?: boolean
        }
        Update: {
          activo?: boolean
          bloque?: Database["public"]["Enums"]["bloque_evaluacion"] | null
          descripcion_que_evalua?: string | null
          dimension?: Database["public"]["Enums"]["dimension_competencia"]
          empresa_id?: string
          id?: string
          nombre?: string
          orden?: number | null
          peso_relativo?: number
          solo_con_personal_a_cargo?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "competencias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      dimension_cursos_recomendados: {
        Row: {
          created_at: string
          curso_id: string
          dimension: string
          empresa_id: string
          id: string
        }
        Insert: {
          created_at?: string
          curso_id: string
          dimension: string
          empresa_id: string
          id?: string
        }
        Update: {
          created_at?: string
          curso_id?: string
          dimension?: string
          empresa_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dimension_cursos_recomendados_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "nexa_cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dimension_cursos_recomendados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      dotacion_entregas: {
        Row: {
          cantidad: number
          categoria: Database["public"]["Enums"]["categoria_dotacion"]
          colaborador_id: string
          created_at: string
          empresa_id: string
          entregado_por: string | null
          estado: Database["public"]["Enums"]["estado_dotacion"]
          fecha_devolucion: string | null
          fecha_entrega: string
          fecha_vencimiento: string | null
          firma_confirmada: boolean
          firmado_en: string | null
          id: string
          nombre_elemento: string
          observaciones: string | null
          talla: string | null
          updated_at: string
        }
        Insert: {
          cantidad?: number
          categoria: Database["public"]["Enums"]["categoria_dotacion"]
          colaborador_id: string
          created_at?: string
          empresa_id: string
          entregado_por?: string | null
          estado?: Database["public"]["Enums"]["estado_dotacion"]
          fecha_devolucion?: string | null
          fecha_entrega?: string
          fecha_vencimiento?: string | null
          firma_confirmada?: boolean
          firmado_en?: string | null
          id?: string
          nombre_elemento: string
          observaciones?: string | null
          talla?: string | null
          updated_at?: string
        }
        Update: {
          cantidad?: number
          categoria?: Database["public"]["Enums"]["categoria_dotacion"]
          colaborador_id?: string
          created_at?: string
          empresa_id?: string
          entregado_por?: string | null
          estado?: Database["public"]["Enums"]["estado_dotacion"]
          fecha_devolucion?: string | null
          fecha_entrega?: string
          fecha_vencimiento?: string | null
          firma_confirmada?: boolean
          firmado_en?: string | null
          id?: string
          nombre_elemento?: string
          observaciones?: string | null
          talla?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dotacion_entregas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dotacion_entregas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "dotacion_entregas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "dotacion_entregas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "dotacion_entregas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "dotacion_entregas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "dotacion_entregas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "dotacion_entregas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
          {
            foreignKeyName: "dotacion_entregas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dotacion_entregas_entregado_por_fkey"
            columns: ["entregado_por"]
            isOneToOne: false
            referencedRelation: "perfiles_usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_identidad: {
        Row: {
          declaracion_creencias: string | null
          empresa_id: string
          proposito_superior: string | null
          updated_at: string
          updated_by: string | null
          vision: string | null
        }
        Insert: {
          declaracion_creencias?: string | null
          empresa_id: string
          proposito_superior?: string | null
          updated_at?: string
          updated_by?: string | null
          vision?: string | null
        }
        Update: {
          declaracion_creencias?: string | null
          empresa_id?: string
          proposito_superior?: string | null
          updated_at?: string
          updated_by?: string | null
          vision?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empresa_identidad_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresa_identidad_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "perfiles_usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_identidad_elementos: {
        Row: {
          descripcion: string | null
          empresa_id: string
          id: string
          nombre: string
          orden: number | null
          tipo: Database["public"]["Enums"]["tipo_elemento_identidad"]
        }
        Insert: {
          descripcion?: string | null
          empresa_id: string
          id?: string
          nombre: string
          orden?: number | null
          tipo: Database["public"]["Enums"]["tipo_elemento_identidad"]
        }
        Update: {
          descripcion?: string | null
          empresa_id?: string
          id?: string
          nombre?: string
          orden?: number | null
          tipo?: Database["public"]["Enums"]["tipo_elemento_identidad"]
        }
        Relationships: [
          {
            foreignKeyName: "empresa_identidad_elementos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          activo: boolean
          ciudad: string | null
          clima_pregunta_comunicacion: string | null
          clima_pregunta_condiciones: string | null
          clima_pregunta_desarrollo: string | null
          clima_pregunta_enps: string | null
          clima_pregunta_liderazgo: string | null
          clima_pregunta_pertenencia: string | null
          clima_pregunta_reconocimiento: string | null
          clima_umbral_cantidad: number
          clima_umbral_porcentaje: number | null
          clima_umbral_tipo: Database["public"]["Enums"]["tipo_umbral_clima"]
          color_marca: string | null
          created_at: string
          direccion: string | null
          estado_facturacion: string
          fecha_fundacion: string | null
          fecha_proximo_pago: string | null
          firmante_cargo: string | null
          firmante_nombre: string | null
          id: string
          logo_url: string | null
          nit: string | null
          nombre: string
          plan_membresia: string
          precio_membresia_mensual: number | null
          siglas: string | null
          slug: string
          telefono: string | null
        }
        Insert: {
          activo?: boolean
          ciudad?: string | null
          clima_pregunta_comunicacion?: string | null
          clima_pregunta_condiciones?: string | null
          clima_pregunta_desarrollo?: string | null
          clima_pregunta_enps?: string | null
          clima_pregunta_liderazgo?: string | null
          clima_pregunta_pertenencia?: string | null
          clima_pregunta_reconocimiento?: string | null
          clima_umbral_cantidad?: number
          clima_umbral_porcentaje?: number | null
          clima_umbral_tipo?: Database["public"]["Enums"]["tipo_umbral_clima"]
          color_marca?: string | null
          created_at?: string
          direccion?: string | null
          estado_facturacion?: string
          fecha_fundacion?: string | null
          fecha_proximo_pago?: string | null
          firmante_cargo?: string | null
          firmante_nombre?: string | null
          id?: string
          logo_url?: string | null
          nit?: string | null
          nombre: string
          plan_membresia?: string
          precio_membresia_mensual?: number | null
          siglas?: string | null
          slug: string
          telefono?: string | null
        }
        Update: {
          activo?: boolean
          ciudad?: string | null
          clima_pregunta_comunicacion?: string | null
          clima_pregunta_condiciones?: string | null
          clima_pregunta_desarrollo?: string | null
          clima_pregunta_enps?: string | null
          clima_pregunta_liderazgo?: string | null
          clima_pregunta_pertenencia?: string | null
          clima_pregunta_reconocimiento?: string | null
          clima_umbral_cantidad?: number
          clima_umbral_porcentaje?: number | null
          clima_umbral_tipo?: Database["public"]["Enums"]["tipo_umbral_clima"]
          color_marca?: string | null
          created_at?: string
          direccion?: string | null
          estado_facturacion?: string
          fecha_fundacion?: string | null
          fecha_proximo_pago?: string | null
          firmante_cargo?: string | null
          firmante_nombre?: string | null
          id?: string
          logo_url?: string | null
          nit?: string | null
          nombre?: string
          plan_membresia?: string
          precio_membresia_mensual?: number | null
          siglas?: string | null
          slug?: string
          telefono?: string | null
        }
        Relationships: []
      }
      entrevistas: {
        Row: {
          created_at: string
          entrevistador_id: string | null
          estado: Database["public"]["Enums"]["estado_entrevista"]
          fecha_hora: string
          id: string
          modalidad: Database["public"]["Enums"]["modalidad_entrevista"]
          notas: string | null
          postulacion_id: string
        }
        Insert: {
          created_at?: string
          entrevistador_id?: string | null
          estado?: Database["public"]["Enums"]["estado_entrevista"]
          fecha_hora: string
          id?: string
          modalidad?: Database["public"]["Enums"]["modalidad_entrevista"]
          notas?: string | null
          postulacion_id: string
        }
        Update: {
          created_at?: string
          entrevistador_id?: string | null
          estado?: Database["public"]["Enums"]["estado_entrevista"]
          fecha_hora?: string
          id?: string
          modalidad?: Database["public"]["Enums"]["modalidad_entrevista"]
          notas?: string | null
          postulacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entrevistas_entrevistador_id_fkey"
            columns: ["entrevistador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entrevistas_entrevistador_id_fkey"
            columns: ["entrevistador_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "entrevistas_entrevistador_id_fkey"
            columns: ["entrevistador_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "entrevistas_entrevistador_id_fkey"
            columns: ["entrevistador_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "entrevistas_entrevistador_id_fkey"
            columns: ["entrevistador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "entrevistas_entrevistador_id_fkey"
            columns: ["entrevistador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "entrevistas_entrevistador_id_fkey"
            columns: ["entrevistador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "entrevistas_entrevistador_id_fkey"
            columns: ["entrevistador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
          {
            foreignKeyName: "entrevistas_postulacion_id_fkey"
            columns: ["postulacion_id"]
            isOneToOne: false
            referencedRelation: "postulaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      entrevistas_salida: {
        Row: {
          colaborador_id: string
          comentarios: string | null
          created_at: string
          fecha: string
          id: string
          motivo_categoria: string | null
          motivo_detalle: string | null
          realizada_por: string | null
          recomendaria_empresa: boolean | null
        }
        Insert: {
          colaborador_id: string
          comentarios?: string | null
          created_at?: string
          fecha?: string
          id?: string
          motivo_categoria?: string | null
          motivo_detalle?: string | null
          realizada_por?: string | null
          recomendaria_empresa?: boolean | null
        }
        Update: {
          colaborador_id?: string
          comentarios?: string | null
          created_at?: string
          fecha?: string
          id?: string
          motivo_categoria?: string | null
          motivo_detalle?: string | null
          realizada_por?: string | null
          recomendaria_empresa?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "entrevistas_salida_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entrevistas_salida_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "entrevistas_salida_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "entrevistas_salida_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "entrevistas_salida_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "entrevistas_salida_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "entrevistas_salida_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "entrevistas_salida_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
          {
            foreignKeyName: "entrevistas_salida_realizada_por_fkey"
            columns: ["realizada_por"]
            isOneToOne: false
            referencedRelation: "perfiles_usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      escala_niveles: {
        Row: {
          descripcion_general: string | null
          empresa_id: string
          etiqueta: string
          id: string
          nivel: number
        }
        Insert: {
          descripcion_general?: string | null
          empresa_id: string
          etiqueta: string
          id?: string
          nivel: number
        }
        Update: {
          descripcion_general?: string | null
          empresa_id?: string
          etiqueta?: string
          id?: string
          nivel?: number
        }
        Relationships: [
          {
            foreignKeyName: "escala_niveles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      etapas_proceso: {
        Row: {
          color: string
          created_at: string
          id: string
          nombre: string
          orden: number
          proceso_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          nombre: string
          orden?: number
          proceso_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          nombre?: string
          orden?: number
          proceso_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "etapas_proceso_proceso_id_fkey"
            columns: ["proceso_id"]
            isOneToOne: false
            referencedRelation: "procesos_gestion"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluacion_items: {
        Row: {
          activo: boolean
          agregado_manualmente: boolean
          bloque: Database["public"]["Enums"]["bloque_evaluacion"]
          cargo_funcion_id: string | null
          competencia_id: string | null
          created_at: string
          descripcion: string | null
          evaluacion_id: string
          id: string
          orden: number | null
          origen: Database["public"]["Enums"]["origen_item_evaluacion"]
          titulo: string
        }
        Insert: {
          activo?: boolean
          agregado_manualmente?: boolean
          bloque: Database["public"]["Enums"]["bloque_evaluacion"]
          cargo_funcion_id?: string | null
          competencia_id?: string | null
          created_at?: string
          descripcion?: string | null
          evaluacion_id: string
          id?: string
          orden?: number | null
          origen?: Database["public"]["Enums"]["origen_item_evaluacion"]
          titulo: string
        }
        Update: {
          activo?: boolean
          agregado_manualmente?: boolean
          bloque?: Database["public"]["Enums"]["bloque_evaluacion"]
          cargo_funcion_id?: string | null
          competencia_id?: string | null
          created_at?: string
          descripcion?: string | null
          evaluacion_id?: string
          id?: string
          orden?: number | null
          origen?: Database["public"]["Enums"]["origen_item_evaluacion"]
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluacion_items_cargo_funcion_id_fkey"
            columns: ["cargo_funcion_id"]
            isOneToOne: false
            referencedRelation: "cargo_funciones_principales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluacion_items_competencia_id_fkey"
            columns: ["competencia_id"]
            isOneToOne: false
            referencedRelation: "competencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluacion_items_evaluacion_id_fkey"
            columns: ["evaluacion_id"]
            isOneToOne: false
            referencedRelation: "evaluaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluacion_tareas: {
        Row: {
          completada: boolean
          evaluacion_id: string
          evaluador_colaborador_id: string
          fecha_completada: string | null
          id: string
          notificado_en: string | null
          recordatorios_enviados: number
          tipo_evaluador: Database["public"]["Enums"]["tipo_evaluador"]
        }
        Insert: {
          completada?: boolean
          evaluacion_id: string
          evaluador_colaborador_id: string
          fecha_completada?: string | null
          id?: string
          notificado_en?: string | null
          recordatorios_enviados?: number
          tipo_evaluador: Database["public"]["Enums"]["tipo_evaluador"]
        }
        Update: {
          completada?: boolean
          evaluacion_id?: string
          evaluador_colaborador_id?: string
          fecha_completada?: string | null
          id?: string
          notificado_en?: string | null
          recordatorios_enviados?: number
          tipo_evaluador?: Database["public"]["Enums"]["tipo_evaluador"]
        }
        Relationships: [
          {
            foreignKeyName: "evaluacion_tareas_evaluacion_id_fkey"
            columns: ["evaluacion_id"]
            isOneToOne: false
            referencedRelation: "evaluaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluacion_tareas_evaluador_colaborador_id_fkey"
            columns: ["evaluador_colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluacion_tareas_evaluador_colaborador_id_fkey"
            columns: ["evaluador_colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "evaluacion_tareas_evaluador_colaborador_id_fkey"
            columns: ["evaluador_colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "evaluacion_tareas_evaluador_colaborador_id_fkey"
            columns: ["evaluador_colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "evaluacion_tareas_evaluador_colaborador_id_fkey"
            columns: ["evaluador_colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "evaluacion_tareas_evaluador_colaborador_id_fkey"
            columns: ["evaluador_colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "evaluacion_tareas_evaluador_colaborador_id_fkey"
            columns: ["evaluador_colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "evaluacion_tareas_evaluador_colaborador_id_fkey"
            columns: ["evaluador_colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
        ]
      }
      evaluaciones: {
        Row: {
          ciclo_id: string
          colaborador_evaluado_id: string
          created_at: string
          id: string
          porcentaje_avance: number
          publicado: boolean
          tenia_personal_a_cargo: boolean
        }
        Insert: {
          ciclo_id: string
          colaborador_evaluado_id: string
          created_at?: string
          id?: string
          porcentaje_avance?: number
          publicado?: boolean
          tenia_personal_a_cargo?: boolean
        }
        Update: {
          ciclo_id?: string
          colaborador_evaluado_id?: string
          created_at?: string
          id?: string
          porcentaje_avance?: number
          publicado?: boolean
          tenia_personal_a_cargo?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "evaluaciones_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ciclos_evaluacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_colaborador_evaluado_id_fkey"
            columns: ["colaborador_evaluado_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_colaborador_evaluado_id_fkey"
            columns: ["colaborador_evaluado_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "evaluaciones_colaborador_evaluado_id_fkey"
            columns: ["colaborador_evaluado_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "evaluaciones_colaborador_evaluado_id_fkey"
            columns: ["colaborador_evaluado_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "evaluaciones_colaborador_evaluado_id_fkey"
            columns: ["colaborador_evaluado_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "evaluaciones_colaborador_evaluado_id_fkey"
            columns: ["colaborador_evaluado_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "evaluaciones_colaborador_evaluado_id_fkey"
            columns: ["colaborador_evaluado_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "evaluaciones_colaborador_evaluado_id_fkey"
            columns: ["colaborador_evaluado_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
        ]
      }
      fechas_especiales_colaborador: {
        Row: {
          colaborador_id: string
          creado_por: string | null
          created_at: string
          descripcion: string
          fecha: string
          id: string
        }
        Insert: {
          colaborador_id: string
          creado_por?: string | null
          created_at?: string
          descripcion: string
          fecha: string
          id?: string
        }
        Update: {
          colaborador_id?: string
          creado_por?: string | null
          created_at?: string
          descripcion?: string
          fecha?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fechas_especiales_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fechas_especiales_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "fechas_especiales_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "fechas_especiales_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "fechas_especiales_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "fechas_especiales_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "fechas_especiales_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "fechas_especiales_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
          {
            foreignKeyName: "fechas_especiales_colaborador_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles_usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      fechas_personales_colaborador: {
        Row: {
          colaborador_id: string
          en_embarazo: boolean
          fecha_baby_shower: string | null
          fecha_matrimonio: string | null
          fecha_probable_parto: string | null
          id: string
          updated_at: string
        }
        Insert: {
          colaborador_id: string
          en_embarazo?: boolean
          fecha_baby_shower?: string | null
          fecha_matrimonio?: string | null
          fecha_probable_parto?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          colaborador_id?: string
          en_embarazo?: boolean
          fecha_baby_shower?: string | null
          fecha_matrimonio?: string | null
          fecha_probable_parto?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fechas_personales_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fechas_personales_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "fechas_personales_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "fechas_personales_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "fechas_personales_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "fechas_personales_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "fechas_personales_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "fechas_personales_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
        ]
      }
      flow_carta_intake: {
        Row: {
          created_at: string
          cuestionamiento_1: string
          cuestionamiento_2: string
          cuestionamiento_3: string
          cuestionario_id: string
          id: string
          razon: string
        }
        Insert: {
          created_at?: string
          cuestionamiento_1: string
          cuestionamiento_2: string
          cuestionamiento_3: string
          cuestionario_id: string
          id?: string
          razon: string
        }
        Update: {
          created_at?: string
          cuestionamiento_1?: string
          cuestionamiento_2?: string
          cuestionamiento_3?: string
          cuestionario_id?: string
          id?: string
          razon?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_carta_intake_cuestionario_id_fkey"
            columns: ["cuestionario_id"]
            isOneToOne: false
            referencedRelation: "flow_cuestionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_cuestionarios: {
        Row: {
          completado_at: string | null
          correo_documentos_enviado_at: string | null
          correo_documentos_error: string | null
          created_at: string
          id: string
          liberado_at: string | null
          respuestas: Json
          updated_at: string
          usuario_id: string
        }
        Insert: {
          completado_at?: string | null
          correo_documentos_enviado_at?: string | null
          correo_documentos_error?: string | null
          created_at?: string
          id?: string
          liberado_at?: string | null
          respuestas?: Json
          updated_at?: string
          usuario_id: string
        }
        Update: {
          completado_at?: string | null
          correo_documentos_enviado_at?: string | null
          correo_documentos_error?: string | null
          created_at?: string
          id?: string
          liberado_at?: string | null
          respuestas?: Json
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_cuestionarios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "flow_perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_documentos: {
        Row: {
          contenido: Json | null
          created_at: string
          cuestionario_id: string
          error_detalle: string | null
          estado: Database["public"]["Enums"]["flow_documento_estado"]
          generado_at: string | null
          id: string
          storage_path: string | null
          tipo: Database["public"]["Enums"]["flow_documento_tipo"]
        }
        Insert: {
          contenido?: Json | null
          created_at?: string
          cuestionario_id: string
          error_detalle?: string | null
          estado?: Database["public"]["Enums"]["flow_documento_estado"]
          generado_at?: string | null
          id?: string
          storage_path?: string | null
          tipo: Database["public"]["Enums"]["flow_documento_tipo"]
        }
        Update: {
          contenido?: Json | null
          created_at?: string
          cuestionario_id?: string
          error_detalle?: string | null
          estado?: Database["public"]["Enums"]["flow_documento_estado"]
          generado_at?: string | null
          id?: string
          storage_path?: string | null
          tipo?: Database["public"]["Enums"]["flow_documento_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "flow_documentos_cuestionario_id_fkey"
            columns: ["cuestionario_id"]
            isOneToOne: false
            referencedRelation: "flow_cuestionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_estados_manuales: {
        Row: {
          actualizado_at: string
          colaborador_id: string
          creado_at: string
          estado: string
          id: string
          nota: string | null
        }
        Insert: {
          actualizado_at?: string
          colaborador_id: string
          creado_at?: string
          estado: string
          id?: string
          nota?: string | null
        }
        Update: {
          actualizado_at?: string
          colaborador_id?: string
          creado_at?: string
          estado?: string
          id?: string
          nota?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flow_estados_manuales_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_estados_manuales_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "flow_estados_manuales_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "flow_estados_manuales_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "flow_estados_manuales_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "flow_estados_manuales_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "flow_estados_manuales_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "flow_estados_manuales_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
        ]
      }
      flow_links_envio: {
        Row: {
          correo_destino: string | null
          creado_at: string
          etiqueta: string | null
          id: string
          modo: string
        }
        Insert: {
          correo_destino?: string | null
          creado_at?: string
          etiqueta?: string | null
          id?: string
          modo?: string
        }
        Update: {
          correo_destino?: string | null
          creado_at?: string
          etiqueta?: string | null
          id?: string
          modo?: string
        }
        Relationships: []
      }
      flow_perfiles: {
        Row: {
          autorizacion_circulo_en: string | null
          autorizacion_envio_en: string | null
          colaborador_circulo_id: string | null
          created_at: string
          email: string
          envio_link_id: string | null
          fecha_nacimiento: string | null
          id: string
          nombre_completo: string
        }
        Insert: {
          autorizacion_circulo_en?: string | null
          autorizacion_envio_en?: string | null
          colaborador_circulo_id?: string | null
          created_at?: string
          email: string
          envio_link_id?: string | null
          fecha_nacimiento?: string | null
          id: string
          nombre_completo: string
        }
        Update: {
          autorizacion_circulo_en?: string | null
          autorizacion_envio_en?: string | null
          colaborador_circulo_id?: string | null
          created_at?: string
          email?: string
          envio_link_id?: string | null
          fecha_nacimiento?: string | null
          id?: string
          nombre_completo?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_perfiles_colaborador_circulo_id_fkey"
            columns: ["colaborador_circulo_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_perfiles_colaborador_circulo_id_fkey"
            columns: ["colaborador_circulo_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "flow_perfiles_colaborador_circulo_id_fkey"
            columns: ["colaborador_circulo_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "flow_perfiles_colaborador_circulo_id_fkey"
            columns: ["colaborador_circulo_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "flow_perfiles_colaborador_circulo_id_fkey"
            columns: ["colaborador_circulo_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "flow_perfiles_colaborador_circulo_id_fkey"
            columns: ["colaborador_circulo_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "flow_perfiles_colaborador_circulo_id_fkey"
            columns: ["colaborador_circulo_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "flow_perfiles_colaborador_circulo_id_fkey"
            columns: ["colaborador_circulo_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
          {
            foreignKeyName: "flow_perfiles_envio_link_id_fkey"
            columns: ["envio_link_id"]
            isOneToOne: false
            referencedRelation: "flow_links_envio"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_resultados: {
        Row: {
          aspectos: Json
          calculado_at: string
          cuestionario_id: string
          id: string
        }
        Insert: {
          aspectos: Json
          calculado_at?: string
          cuestionario_id: string
          id?: string
        }
        Update: {
          aspectos?: Json
          calculado_at?: string
          cuestionario_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_resultados_cuestionario_id_fkey"
            columns: ["cuestionario_id"]
            isOneToOne: false
            referencedRelation: "flow_cuestionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      guia_del_flow: {
        Row: {
          colaborador_id: string
          created_at: string
          cuestionario_flow_id: string | null
          documento_pdf_url: string | null
          etapa_evolucion_personal: string | null
          fecha_aplicacion: string
          id: string
          informe_colaborador: string | null
          informe_colaborador_generado_at: string | null
          informe_lider: string | null
          informe_lider_generado_at: string | null
          manejo_emocional: string | null
          motivaciones_profundas: string | null
          origen_flow: string | null
          perfil_narrativo_completo: string | null
          proposito: string | null
          respuestas_cuestionario: Json | null
          senales_apoyo: Json | null
          talentos_naturales: string | null
          temperamento: string | null
        }
        Insert: {
          colaborador_id: string
          created_at?: string
          cuestionario_flow_id?: string | null
          documento_pdf_url?: string | null
          etapa_evolucion_personal?: string | null
          fecha_aplicacion?: string
          id?: string
          informe_colaborador?: string | null
          informe_colaborador_generado_at?: string | null
          informe_lider?: string | null
          informe_lider_generado_at?: string | null
          manejo_emocional?: string | null
          motivaciones_profundas?: string | null
          origen_flow?: string | null
          perfil_narrativo_completo?: string | null
          proposito?: string | null
          respuestas_cuestionario?: Json | null
          senales_apoyo?: Json | null
          talentos_naturales?: string | null
          temperamento?: string | null
        }
        Update: {
          colaborador_id?: string
          created_at?: string
          cuestionario_flow_id?: string | null
          documento_pdf_url?: string | null
          etapa_evolucion_personal?: string | null
          fecha_aplicacion?: string
          id?: string
          informe_colaborador?: string | null
          informe_colaborador_generado_at?: string | null
          informe_lider?: string | null
          informe_lider_generado_at?: string | null
          manejo_emocional?: string | null
          motivaciones_profundas?: string | null
          origen_flow?: string | null
          perfil_narrativo_completo?: string | null
          proposito?: string | null
          respuestas_cuestionario?: Json | null
          senales_apoyo?: Json | null
          talentos_naturales?: string | null
          temperamento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guia_del_flow_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guia_del_flow_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "guia_del_flow_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "guia_del_flow_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "guia_del_flow_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "guia_del_flow_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "guia_del_flow_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "guia_del_flow_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
        ]
      }
      guia_del_flow_invitaciones: {
        Row: {
          colaborador_id: string
          creado_por: string | null
          created_at: string
          id: string
          token: string
          usado_at: string | null
          usado_por_usuario_flow_id: string | null
        }
        Insert: {
          colaborador_id: string
          creado_por?: string | null
          created_at?: string
          id?: string
          token?: string
          usado_at?: string | null
          usado_por_usuario_flow_id?: string | null
        }
        Update: {
          colaborador_id?: string
          creado_por?: string | null
          created_at?: string
          id?: string
          token?: string
          usado_at?: string | null
          usado_por_usuario_flow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guia_del_flow_invitaciones_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guia_del_flow_invitaciones_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "guia_del_flow_invitaciones_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "guia_del_flow_invitaciones_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "guia_del_flow_invitaciones_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "guia_del_flow_invitaciones_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "guia_del_flow_invitaciones_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "guia_del_flow_invitaciones_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
          {
            foreignKeyName: "guia_del_flow_invitaciones_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles_usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      guia_del_flow_sincronizaciones: {
        Row: {
          colaborador_id: string | null
          correo: string
          detalle: string | null
          empresa_id: string | null
          guia_del_flow_id: string | null
          id: string
          intentado_at: string
          nombre_flow: string | null
          resultado: string
        }
        Insert: {
          colaborador_id?: string | null
          correo: string
          detalle?: string | null
          empresa_id?: string | null
          guia_del_flow_id?: string | null
          id?: string
          intentado_at?: string
          nombre_flow?: string | null
          resultado: string
        }
        Update: {
          colaborador_id?: string | null
          correo?: string
          detalle?: string | null
          empresa_id?: string | null
          guia_del_flow_id?: string | null
          id?: string
          intentado_at?: string
          nombre_flow?: string | null
          resultado?: string
        }
        Relationships: [
          {
            foreignKeyName: "guia_del_flow_sincronizaciones_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guia_del_flow_sincronizaciones_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "guia_del_flow_sincronizaciones_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "guia_del_flow_sincronizaciones_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "guia_del_flow_sincronizaciones_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "guia_del_flow_sincronizaciones_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "guia_del_flow_sincronizaciones_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "guia_del_flow_sincronizaciones_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
          {
            foreignKeyName: "guia_del_flow_sincronizaciones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guia_del_flow_sincronizaciones_guia_del_flow_id_fkey"
            columns: ["guia_del_flow_id"]
            isOneToOne: false
            referencedRelation: "guia_del_flow"
            referencedColumns: ["id"]
          },
        ]
      }
      historial_movimientos: {
        Row: {
          cargo_anterior_id: string | null
          cargo_nuevo_id: string | null
          colaborador_id: string
          created_at: string
          descripcion: string | null
          fecha: string
          gravedad: string | null
          id: string
          registrado_por: string | null
          soporte_url: string | null
          tipo: string | null
        }
        Insert: {
          cargo_anterior_id?: string | null
          cargo_nuevo_id?: string | null
          colaborador_id: string
          created_at?: string
          descripcion?: string | null
          fecha?: string
          gravedad?: string | null
          id?: string
          registrado_por?: string | null
          soporte_url?: string | null
          tipo?: string | null
        }
        Update: {
          cargo_anterior_id?: string | null
          cargo_nuevo_id?: string | null
          colaborador_id?: string
          created_at?: string
          descripcion?: string | null
          fecha?: string
          gravedad?: string | null
          id?: string
          registrado_por?: string | null
          soporte_url?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historial_movimientos_cargo_anterior_id_fkey"
            columns: ["cargo_anterior_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_movimientos_cargo_nuevo_id_fkey"
            columns: ["cargo_nuevo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_movimientos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_movimientos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "historial_movimientos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "historial_movimientos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "historial_movimientos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "historial_movimientos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "historial_movimientos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "historial_movimientos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
          {
            foreignKeyName: "historial_movimientos_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "perfiles_usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      hoja_vida_formacion: {
        Row: {
          colaborador_id: string
          created_at: string
          documento_url: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          fecha_vencimiento: string | null
          id: string
          institucion: string | null
          tipo: string | null
          titulo: string
          verificado: boolean
          verificado_por: string | null
        }
        Insert: {
          colaborador_id: string
          created_at?: string
          documento_url?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          fecha_vencimiento?: string | null
          id?: string
          institucion?: string | null
          tipo?: string | null
          titulo: string
          verificado?: boolean
          verificado_por?: string | null
        }
        Update: {
          colaborador_id?: string
          created_at?: string
          documento_url?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          fecha_vencimiento?: string | null
          id?: string
          institucion?: string | null
          tipo?: string | null
          titulo?: string
          verificado?: boolean
          verificado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hoja_vida_formacion_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hoja_vida_formacion_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "hoja_vida_formacion_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "hoja_vida_formacion_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "hoja_vida_formacion_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "hoja_vida_formacion_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "hoja_vida_formacion_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "hoja_vida_formacion_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
          {
            foreignKeyName: "hoja_vida_formacion_verificado_por_fkey"
            columns: ["verificado_por"]
            isOneToOne: false
            referencedRelation: "perfiles_usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      incapacidades_colaborador: {
        Row: {
          colaborador_id: string
          created_at: string
          dias: number | null
          entidad_emisora: string | null
          fecha_fin: string
          fecha_inicio: string
          id: string
          registrada_por: string | null
          soporte_url: string | null
          tipo: Database["public"]["Enums"]["tipo_incapacidad"]
        }
        Insert: {
          colaborador_id: string
          created_at?: string
          dias?: number | null
          entidad_emisora?: string | null
          fecha_fin: string
          fecha_inicio: string
          id?: string
          registrada_por?: string | null
          soporte_url?: string | null
          tipo?: Database["public"]["Enums"]["tipo_incapacidad"]
        }
        Update: {
          colaborador_id?: string
          created_at?: string
          dias?: number | null
          entidad_emisora?: string | null
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          registrada_por?: string | null
          soporte_url?: string | null
          tipo?: Database["public"]["Enums"]["tipo_incapacidad"]
        }
        Relationships: [
          {
            foreignKeyName: "incapacidades_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incapacidades_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "incapacidades_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "incapacidades_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "incapacidades_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "incapacidades_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "incapacidades_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "incapacidades_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
          {
            foreignKeyName: "incapacidades_colaborador_registrada_por_fkey"
            columns: ["registrada_por"]
            isOneToOne: false
            referencedRelation: "perfiles_usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      induccion_items: {
        Row: {
          activo: boolean
          cargo_id: string | null
          categoria: Database["public"]["Enums"]["categoria_induccion"]
          created_at: string
          descripcion: string | null
          empresa_id: string
          id: string
          orden: number | null
          titulo: string
        }
        Insert: {
          activo?: boolean
          cargo_id?: string | null
          categoria?: Database["public"]["Enums"]["categoria_induccion"]
          created_at?: string
          descripcion?: string | null
          empresa_id: string
          id?: string
          orden?: number | null
          titulo: string
        }
        Update: {
          activo?: boolean
          cargo_id?: string | null
          categoria?: Database["public"]["Enums"]["categoria_induccion"]
          created_at?: string
          descripcion?: string | null
          empresa_id?: string
          id?: string
          orden?: number | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "induccion_items_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "induccion_items_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      matriz_riesgos_controles: {
        Row: {
          categoria_riesgo: string | null
          control: string | null
          created_at: string
          empresa_id: string
          estado: string
          id: string
          impacto: string | null
          marco_normativo: string
          probabilidad: string | null
          proceso_id: string | null
          responsable_id: string | null
          riesgo: string
        }
        Insert: {
          categoria_riesgo?: string | null
          control?: string | null
          created_at?: string
          empresa_id: string
          estado?: string
          id?: string
          impacto?: string | null
          marco_normativo: string
          probabilidad?: string | null
          proceso_id?: string | null
          responsable_id?: string | null
          riesgo: string
        }
        Update: {
          categoria_riesgo?: string | null
          control?: string | null
          created_at?: string
          empresa_id?: string
          estado?: string
          id?: string
          impacto?: string | null
          marco_normativo?: string
          probabilidad?: string | null
          proceso_id?: string | null
          responsable_id?: string | null
          riesgo?: string
        }
        Relationships: [
          {
            foreignKeyName: "matriz_riesgos_controles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriz_riesgos_controles_proceso_id_fkey"
            columns: ["proceso_id"]
            isOneToOne: false
            referencedRelation: "procesos_gestion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriz_riesgos_controles_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriz_riesgos_controles_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "matriz_riesgos_controles_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "matriz_riesgos_controles_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "matriz_riesgos_controles_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "matriz_riesgos_controles_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "matriz_riesgos_controles_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "matriz_riesgos_controles_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
        ]
      }
      mensajes_directos: {
        Row: {
          contenido: string
          created_at: string
          destinatario_id: string
          empresa_id: string
          id: string
          leido: boolean
          leido_en: string | null
          remitente_id: string
        }
        Insert: {
          contenido: string
          created_at?: string
          destinatario_id: string
          empresa_id: string
          id?: string
          leido?: boolean
          leido_en?: string | null
          remitente_id: string
        }
        Update: {
          contenido?: string
          created_at?: string
          destinatario_id?: string
          empresa_id?: string
          id?: string
          leido?: boolean
          leido_en?: string | null
          remitente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_directos_destinatario_id_fkey"
            columns: ["destinatario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_directos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_directos_remitente_id_fkey"
            columns: ["remitente_id"]
            isOneToOne: false
            referencedRelation: "perfiles_usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      nexa_asistente_conversaciones: {
        Row: {
          categoria: string | null
          created_at: string
          id: string
          pregunta: string
          respuesta: string | null
          usuario_id: string
          util: boolean | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          id?: string
          pregunta: string
          respuesta?: string | null
          usuario_id: string
          util?: boolean | null
        }
        Update: {
          categoria?: string | null
          created_at?: string
          id?: string
          pregunta?: string
          respuesta?: string | null
          usuario_id?: string
          util?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "nexa_asistente_conversaciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      nexa_curso_opciones: {
        Row: {
          correcta: boolean
          id: string
          orden: number
          pregunta_id: string
          texto: string
        }
        Insert: {
          correcta?: boolean
          id?: string
          orden?: number
          pregunta_id: string
          texto: string
        }
        Update: {
          correcta?: boolean
          id?: string
          orden?: number
          pregunta_id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexa_curso_opciones_pregunta_id_fkey"
            columns: ["pregunta_id"]
            isOneToOne: false
            referencedRelation: "nexa_curso_preguntas"
            referencedColumns: ["id"]
          },
        ]
      }
      nexa_curso_preguntas: {
        Row: {
          created_at: string
          curso_id: string
          enunciado: string
          id: string
          orden: number
        }
        Insert: {
          created_at?: string
          curso_id: string
          enunciado: string
          id?: string
          orden?: number
        }
        Update: {
          created_at?: string
          curso_id?: string
          enunciado?: string
          id?: string
          orden?: number
        }
        Relationships: [
          {
            foreignKeyName: "nexa_curso_preguntas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "nexa_cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      nexa_cursos: {
        Row: {
          activo: boolean
          categoria: string | null
          contenido_url: string | null
          created_at: string
          descripcion: string | null
          duracion_minutos: number | null
          empresa_id: string
          id: string
          puntos_otorgados: number
          quiz_umbral_aprobacion: number
          titulo: string
        }
        Insert: {
          activo?: boolean
          categoria?: string | null
          contenido_url?: string | null
          created_at?: string
          descripcion?: string | null
          duracion_minutos?: number | null
          empresa_id: string
          id?: string
          puntos_otorgados?: number
          quiz_umbral_aprobacion?: number
          titulo: string
        }
        Update: {
          activo?: boolean
          categoria?: string | null
          contenido_url?: string | null
          created_at?: string
          descripcion?: string | null
          duracion_minutos?: number | null
          empresa_id?: string
          id?: string
          puntos_otorgados?: number
          quiz_umbral_aprobacion?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexa_cursos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      nexa_directorio_aliados: {
        Row: {
          contacto: string | null
          empresa_id: string
          id: string
          nombre: string
          notas: string | null
          tipo: string | null
        }
        Insert: {
          contacto?: string | null
          empresa_id: string
          id?: string
          nombre: string
          notas?: string | null
          tipo?: string | null
        }
        Update: {
          contacto?: string | null
          empresa_id?: string
          id?: string
          nombre?: string
          notas?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nexa_directorio_aliados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      nexa_documentos_politica: {
        Row: {
          activo: boolean
          archivo_url: string | null
          categoria: string
          contenido: string
          created_at: string
          empresa_id: string
          id: string
          subido_por: string | null
          titulo: string
        }
        Insert: {
          activo?: boolean
          archivo_url?: string | null
          categoria?: string
          contenido: string
          created_at?: string
          empresa_id: string
          id?: string
          subido_por?: string | null
          titulo: string
        }
        Update: {
          activo?: boolean
          archivo_url?: string | null
          categoria?: string
          contenido?: string
          created_at?: string
          empresa_id?: string
          id?: string
          subido_por?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexa_documentos_politica_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexa_documentos_politica_subido_por_fkey"
            columns: ["subido_por"]
            isOneToOne: false
            referencedRelation: "perfiles_usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      nexa_feed_publicaciones: {
        Row: {
          archivo_nombre: string | null
          archivo_tamano_bytes: number | null
          archivo_url: string | null
          autor_id: string | null
          contenido: string | null
          created_at: string
          empresa_id: string
          fijado: boolean
          id: string
          imagen_url: string | null
          link_preview_descripcion: string | null
          link_preview_imagen: string | null
          link_preview_titulo: string | null
          link_url: string | null
          tipo: Database["public"]["Enums"]["tipo_publicacion"]
          tipo_adjunto: Database["public"]["Enums"]["tipo_adjunto_feed"]
          titulo: string
        }
        Insert: {
          archivo_nombre?: string | null
          archivo_tamano_bytes?: number | null
          archivo_url?: string | null
          autor_id?: string | null
          contenido?: string | null
          created_at?: string
          empresa_id: string
          fijado?: boolean
          id?: string
          imagen_url?: string | null
          link_preview_descripcion?: string | null
          link_preview_imagen?: string | null
          link_preview_titulo?: string | null
          link_url?: string | null
          tipo?: Database["public"]["Enums"]["tipo_publicacion"]
          tipo_adjunto?: Database["public"]["Enums"]["tipo_adjunto_feed"]
          titulo: string
        }
        Update: {
          archivo_nombre?: string | null
          archivo_tamano_bytes?: number | null
          archivo_url?: string | null
          autor_id?: string | null
          contenido?: string | null
          created_at?: string
          empresa_id?: string
          fijado?: boolean
          id?: string
          imagen_url?: string | null
          link_preview_descripcion?: string | null
          link_preview_imagen?: string | null
          link_preview_titulo?: string | null
          link_url?: string | null
          tipo?: Database["public"]["Enums"]["tipo_publicacion"]
          tipo_adjunto?: Database["public"]["Enums"]["tipo_adjunto_feed"]
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexa_feed_publicaciones_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "perfiles_usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexa_feed_publicaciones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      nexa_feed_reacciones: {
        Row: {
          created_at: string
          id: string
          publicacion_id: string
          tipo: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          publicacion_id: string
          tipo?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          id?: string
          publicacion_id?: string
          tipo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexa_feed_reacciones_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "nexa_feed_publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexa_feed_reacciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      nexa_insignias: {
        Row: {
          criterio_otorgamiento: string | null
          descripcion: string | null
          empresa_id: string
          icono: string | null
          id: string
          nombre: string
        }
        Insert: {
          criterio_otorgamiento?: string | null
          descripcion?: string | null
          empresa_id: string
          icono?: string | null
          id?: string
          nombre: string
        }
        Update: {
          criterio_otorgamiento?: string | null
          descripcion?: string | null
          empresa_id?: string
          icono?: string | null
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexa_insignias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      nexa_reconocimientos: {
        Row: {
          colaborador_id: string
          evaluacion_origen_id: string | null
          id: string
          insignia_id: string | null
          motivo: string | null
          otorgado_en: string
          otorgado_por: string | null
          puntos: number
        }
        Insert: {
          colaborador_id: string
          evaluacion_origen_id?: string | null
          id?: string
          insignia_id?: string | null
          motivo?: string | null
          otorgado_en?: string
          otorgado_por?: string | null
          puntos?: number
        }
        Update: {
          colaborador_id?: string
          evaluacion_origen_id?: string | null
          id?: string
          insignia_id?: string | null
          motivo?: string | null
          otorgado_en?: string
          otorgado_por?: string | null
          puntos?: number
        }
        Relationships: [
          {
            foreignKeyName: "nexa_reconocimientos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexa_reconocimientos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "nexa_reconocimientos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "nexa_reconocimientos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "nexa_reconocimientos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "nexa_reconocimientos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "nexa_reconocimientos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "nexa_reconocimientos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
          {
            foreignKeyName: "nexa_reconocimientos_evaluacion_origen_id_fkey"
            columns: ["evaluacion_origen_id"]
            isOneToOne: false
            referencedRelation: "evaluaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexa_reconocimientos_insignia_id_fkey"
            columns: ["insignia_id"]
            isOneToOne: false
            referencedRelation: "nexa_insignias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexa_reconocimientos_otorgado_por_fkey"
            columns: ["otorgado_por"]
            isOneToOne: false
            referencedRelation: "perfiles_usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      nexa_rutas_formacion: {
        Row: {
          alerta_origen_id: string | null
          asignado_en: string
          colaborador_id: string
          completado_en: string | null
          curso_id: string
          estado: Database["public"]["Enums"]["estado_curso_colaborador"]
          evidencia_url: string | null
          fecha_limite: string | null
          id: string
          pdi_origen_id: string | null
          progreso_pct: number
          quiz_aprobado_en: string | null
          quiz_intentos: number
          quiz_puntaje_pct: number | null
          verificacion_saber_origen_id: string | null
        }
        Insert: {
          alerta_origen_id?: string | null
          asignado_en?: string
          colaborador_id: string
          completado_en?: string | null
          curso_id: string
          estado?: Database["public"]["Enums"]["estado_curso_colaborador"]
          evidencia_url?: string | null
          fecha_limite?: string | null
          id?: string
          pdi_origen_id?: string | null
          progreso_pct?: number
          quiz_aprobado_en?: string | null
          quiz_intentos?: number
          quiz_puntaje_pct?: number | null
          verificacion_saber_origen_id?: string | null
        }
        Update: {
          alerta_origen_id?: string | null
          asignado_en?: string
          colaborador_id?: string
          completado_en?: string | null
          curso_id?: string
          estado?: Database["public"]["Enums"]["estado_curso_colaborador"]
          evidencia_url?: string | null
          fecha_limite?: string | null
          id?: string
          pdi_origen_id?: string | null
          progreso_pct?: number
          quiz_aprobado_en?: string | null
          quiz_intentos?: number
          quiz_puntaje_pct?: number | null
          verificacion_saber_origen_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nexa_rutas_formacion_alerta_origen_id_fkey"
            columns: ["alerta_origen_id"]
            isOneToOne: false
            referencedRelation: "alertas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexa_rutas_formacion_alerta_origen_id_fkey"
            columns: ["alerta_origen_id"]
            isOneToOne: false
            referencedRelation: "v_alertas_proximas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexa_rutas_formacion_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexa_rutas_formacion_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "nexa_rutas_formacion_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "nexa_rutas_formacion_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "nexa_rutas_formacion_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "nexa_rutas_formacion_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "nexa_rutas_formacion_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "nexa_rutas_formacion_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
          {
            foreignKeyName: "nexa_rutas_formacion_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "nexa_cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexa_rutas_formacion_pdi_origen_id_fkey"
            columns: ["pdi_origen_id"]
            isOneToOne: false
            referencedRelation: "planes_desarrollo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexa_rutas_formacion_verificacion_saber_origen_id_fkey"
            columns: ["verificacion_saber_origen_id"]
            isOneToOne: false
            referencedRelation: "verificaciones_saber"
            referencedColumns: ["id"]
          },
        ]
      }
      nexa_rutas_por_cargo: {
        Row: {
          cargo_id: string
          curso_id: string
          id: string
          nivel_riesgo: Database["public"]["Enums"]["nivel_riesgo_cargo"]
          obligatorio: boolean
        }
        Insert: {
          cargo_id: string
          curso_id: string
          id?: string
          nivel_riesgo?: Database["public"]["Enums"]["nivel_riesgo_cargo"]
          obligatorio?: boolean
        }
        Update: {
          cargo_id?: string
          curso_id?: string
          id?: string
          nivel_riesgo?: Database["public"]["Enums"]["nivel_riesgo_cargo"]
          obligatorio?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "nexa_rutas_por_cargo_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexa_rutas_por_cargo_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "nexa_cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      nexa_simulacro_participantes: {
        Row: {
          asistio: boolean
          calificacion_desempeno: number | null
          colaborador_id: string
          id: string
          simulacro_id: string
        }
        Insert: {
          asistio?: boolean
          calificacion_desempeno?: number | null
          colaborador_id: string
          id?: string
          simulacro_id: string
        }
        Update: {
          asistio?: boolean
          calificacion_desempeno?: number | null
          colaborador_id?: string
          id?: string
          simulacro_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexa_simulacro_participantes_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexa_simulacro_participantes_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "nexa_simulacro_participantes_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "nexa_simulacro_participantes_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "nexa_simulacro_participantes_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "nexa_simulacro_participantes_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "nexa_simulacro_participantes_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "nexa_simulacro_participantes_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
          {
            foreignKeyName: "nexa_simulacro_participantes_simulacro_id_fkey"
            columns: ["simulacro_id"]
            isOneToOne: false
            referencedRelation: "nexa_simulacros"
            referencedColumns: ["id"]
          },
        ]
      }
      nexa_simulacros: {
        Row: {
          created_at: string
          descripcion: string | null
          empresa_id: string
          fecha: string | null
          id: string
          participantes_esperados: number | null
          titulo: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          empresa_id: string
          fecha?: string | null
          id?: string
          participantes_esperados?: number | null
          titulo: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          empresa_id?: string
          fecha?: string | null
          id?: string
          participantes_esperados?: number | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexa_simulacros_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      notebook_notas: {
        Row: {
          contenido: string | null
          created_at: string
          id: string
          titulo: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          contenido?: string | null
          created_at?: string
          id?: string
          titulo: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          contenido?: string | null
          created_at?: string
          id?: string
          titulo?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notebook_notas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          alerta_id: string | null
          asunto: string | null
          canal: Database["public"]["Enums"]["canal_notificacion"]
          created_at: string
          cuerpo: string | null
          destinatario_usuario_id: string | null
          enviado: boolean
          enviado_en: string | null
          evaluacion_tarea_id: string | null
          id: string
          leido: boolean
          leido_en: string | null
        }
        Insert: {
          alerta_id?: string | null
          asunto?: string | null
          canal?: Database["public"]["Enums"]["canal_notificacion"]
          created_at?: string
          cuerpo?: string | null
          destinatario_usuario_id?: string | null
          enviado?: boolean
          enviado_en?: string | null
          evaluacion_tarea_id?: string | null
          id?: string
          leido?: boolean
          leido_en?: string | null
        }
        Update: {
          alerta_id?: string | null
          asunto?: string | null
          canal?: Database["public"]["Enums"]["canal_notificacion"]
          created_at?: string
          cuerpo?: string | null
          destinatario_usuario_id?: string | null
          enviado?: boolean
          enviado_en?: string | null
          evaluacion_tarea_id?: string | null
          id?: string
          leido?: boolean
          leido_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_alerta_id_fkey"
            columns: ["alerta_id"]
            isOneToOne: false
            referencedRelation: "alertas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_alerta_id_fkey"
            columns: ["alerta_id"]
            isOneToOne: false
            referencedRelation: "v_alertas_proximas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_destinatario_usuario_id_fkey"
            columns: ["destinatario_usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_evaluacion_tarea_id_fkey"
            columns: ["evaluacion_tarea_id"]
            isOneToOne: false
            referencedRelation: "evaluacion_tareas"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles_usuario: {
        Row: {
          activo: boolean
          created_at: string
          email: string
          empresa_id: string
          es_superadmin: boolean
          id: string
          nombre_completo: string
          nombre_preferido: string | null
          rol: Database["public"]["Enums"]["rol_usuario"]
          usuario: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          email: string
          empresa_id: string
          es_superadmin?: boolean
          id: string
          nombre_completo: string
          nombre_preferido?: string | null
          rol?: Database["public"]["Enums"]["rol_usuario"]
          usuario: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          email?: string
          empresa_id?: string
          es_superadmin?: boolean
          id?: string
          nombre_completo?: string
          nombre_preferido?: string | null
          rol?: Database["public"]["Enums"]["rol_usuario"]
          usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_usuario_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      planes_desarrollo: {
        Row: {
          accion: string
          brecha_detectada: string
          ciclo_origen_id: string | null
          colaborador_id: string
          created_at: string
          estado: Database["public"]["Enums"]["estado_pdi"]
          evidencia_url: string | null
          fecha_compromiso: string | null
          fecha_cumplimiento: string | null
          generado_automaticamente: boolean
          id: string
          notas: string | null
          origen: Database["public"]["Enums"]["origen_pdi"]
          responsable_id: string | null
          updated_at: string
        }
        Insert: {
          accion: string
          brecha_detectada: string
          ciclo_origen_id?: string | null
          colaborador_id: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_pdi"]
          evidencia_url?: string | null
          fecha_compromiso?: string | null
          fecha_cumplimiento?: string | null
          generado_automaticamente?: boolean
          id?: string
          notas?: string | null
          origen?: Database["public"]["Enums"]["origen_pdi"]
          responsable_id?: string | null
          updated_at?: string
        }
        Update: {
          accion?: string
          brecha_detectada?: string
          ciclo_origen_id?: string | null
          colaborador_id?: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_pdi"]
          evidencia_url?: string | null
          fecha_compromiso?: string | null
          fecha_cumplimiento?: string | null
          generado_automaticamente?: boolean
          id?: string
          notas?: string | null
          origen?: Database["public"]["Enums"]["origen_pdi"]
          responsable_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planes_desarrollo_ciclo_origen_id_fkey"
            columns: ["ciclo_origen_id"]
            isOneToOne: false
            referencedRelation: "ciclos_evaluacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planes_desarrollo_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planes_desarrollo_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "planes_desarrollo_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "planes_desarrollo_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "planes_desarrollo_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "planes_desarrollo_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "planes_desarrollo_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "planes_desarrollo_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
          {
            foreignKeyName: "planes_desarrollo_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planes_desarrollo_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "planes_desarrollo_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "planes_desarrollo_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "planes_desarrollo_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "planes_desarrollo_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "planes_desarrollo_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "planes_desarrollo_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
        ]
      }
      postulaciones: {
        Row: {
          calificacion: number | null
          candidato_id: string
          created_at: string
          descartado_motivo: string | null
          etapa: Database["public"]["Enums"]["etapa_postulacion"]
          id: string
          notas: string | null
          orden: number
          updated_at: string
          vacante_id: string
        }
        Insert: {
          calificacion?: number | null
          candidato_id: string
          created_at?: string
          descartado_motivo?: string | null
          etapa?: Database["public"]["Enums"]["etapa_postulacion"]
          id?: string
          notas?: string | null
          orden?: number
          updated_at?: string
          vacante_id: string
        }
        Update: {
          calificacion?: number | null
          candidato_id?: string
          created_at?: string
          descartado_motivo?: string | null
          etapa?: Database["public"]["Enums"]["etapa_postulacion"]
          id?: string
          notas?: string | null
          orden?: number
          updated_at?: string
          vacante_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "postulaciones_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postulaciones_vacante_id_fkey"
            columns: ["vacante_id"]
            isOneToOne: false
            referencedRelation: "vacantes"
            referencedColumns: ["id"]
          },
        ]
      }
      procesos_gestion: {
        Row: {
          area_proceso: string
          created_at: string
          descripcion: string | null
          empresa_id: string
          fecha_actualizacion: string
          flujograma_url: string | null
          id: string
          nombre: string
          responsable_id: string | null
          version: string | null
        }
        Insert: {
          area_proceso: string
          created_at?: string
          descripcion?: string | null
          empresa_id: string
          fecha_actualizacion?: string
          flujograma_url?: string | null
          id?: string
          nombre: string
          responsable_id?: string | null
          version?: string | null
        }
        Update: {
          area_proceso?: string
          created_at?: string
          descripcion?: string | null
          empresa_id?: string
          fecha_actualizacion?: string
          flujograma_url?: string | null
          id?: string
          nombre?: string
          responsable_id?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procesos_gestion_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procesos_gestion_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procesos_gestion_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "procesos_gestion_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "procesos_gestion_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "procesos_gestion_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "procesos_gestion_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "procesos_gestion_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "procesos_gestion_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
        ]
      }
      referencias_candidato: {
        Row: {
          candidato_id: string
          created_at: string
          id: string
          nombre_referencia: string
          notas: string | null
          relacion: string | null
          telefono_referencia: string | null
          verificada: boolean
          verificado_en: string | null
          verificado_por: string | null
        }
        Insert: {
          candidato_id: string
          created_at?: string
          id?: string
          nombre_referencia: string
          notas?: string | null
          relacion?: string | null
          telefono_referencia?: string | null
          verificada?: boolean
          verificado_en?: string | null
          verificado_por?: string | null
        }
        Update: {
          candidato_id?: string
          created_at?: string
          id?: string
          nombre_referencia?: string
          notas?: string | null
          relacion?: string | null
          telefono_referencia?: string | null
          verificada?: boolean
          verificado_en?: string | null
          verificado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referencias_candidato_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referencias_candidato_verificado_por_fkey"
            columns: ["verificado_por"]
            isOneToOne: false
            referencedRelation: "perfiles_usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      respuestas_evaluacion: {
        Row: {
          comentario: string | null
          competencia_id: string | null
          created_at: string
          evaluacion_item_id: string | null
          evaluacion_tarea_id: string
          id: string
          nota: number
          observacion: string | null
          resultado_real: string | null
        }
        Insert: {
          comentario?: string | null
          competencia_id?: string | null
          created_at?: string
          evaluacion_item_id?: string | null
          evaluacion_tarea_id: string
          id?: string
          nota: number
          observacion?: string | null
          resultado_real?: string | null
        }
        Update: {
          comentario?: string | null
          competencia_id?: string | null
          created_at?: string
          evaluacion_item_id?: string | null
          evaluacion_tarea_id?: string
          id?: string
          nota?: number
          observacion?: string | null
          resultado_real?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "respuestas_evaluacion_competencia_id_fkey"
            columns: ["competencia_id"]
            isOneToOne: false
            referencedRelation: "competencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respuestas_evaluacion_evaluacion_item_id_fkey"
            columns: ["evaluacion_item_id"]
            isOneToOne: false
            referencedRelation: "evaluacion_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respuestas_evaluacion_evaluacion_tarea_id_fkey"
            columns: ["evaluacion_tarea_id"]
            isOneToOne: false
            referencedRelation: "evaluacion_tareas"
            referencedColumns: ["id"]
          },
        ]
      }
      resultados_evaluacion: {
        Row: {
          actualizado_en: string
          brecha_deber: number | null
          brecha_hacer: number | null
          detalle_por_competencia: Json | null
          evaluacion_id: string
          indice_deber: number | null
          indice_hacer: number | null
          semaforo_deber: string | null
          semaforo_hacer: string | null
        }
        Insert: {
          actualizado_en?: string
          brecha_deber?: number | null
          brecha_hacer?: number | null
          detalle_por_competencia?: Json | null
          evaluacion_id: string
          indice_deber?: number | null
          indice_hacer?: number | null
          semaforo_deber?: string | null
          semaforo_hacer?: string | null
        }
        Update: {
          actualizado_en?: string
          brecha_deber?: number | null
          brecha_hacer?: number | null
          detalle_por_competencia?: Json | null
          evaluacion_id?: string
          indice_deber?: number | null
          indice_hacer?: number | null
          semaforo_deber?: string | null
          semaforo_hacer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resultados_evaluacion_evaluacion_id_fkey"
            columns: ["evaluacion_id"]
            isOneToOne: true
            referencedRelation: "evaluaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      ser_aspectos: {
        Row: {
          bloque: Database["public"]["Enums"]["bloque_ser"]
          empresa_id: string
          id: string
          nombre: string
          orden: number | null
          sensible: boolean
        }
        Insert: {
          bloque: Database["public"]["Enums"]["bloque_ser"]
          empresa_id: string
          id?: string
          nombre: string
          orden?: number | null
          sensible?: boolean
        }
        Update: {
          bloque?: Database["public"]["Enums"]["bloque_ser"]
          empresa_id?: string
          id?: string
          nombre?: string
          orden?: number | null
          sensible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ser_aspectos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      ser_comentarios_colaborador: {
        Row: {
          aspecto_id: string | null
          colaborador_id: string
          comentario: string
          created_at: string
          guia_del_flow_id: string
          id: string
          updated_at: string
        }
        Insert: {
          aspecto_id?: string | null
          colaborador_id: string
          comentario: string
          created_at?: string
          guia_del_flow_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          aspecto_id?: string | null
          colaborador_id?: string
          comentario?: string
          created_at?: string
          guia_del_flow_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ser_comentarios_colaborador_aspecto_id_fkey"
            columns: ["aspecto_id"]
            isOneToOne: false
            referencedRelation: "ser_aspectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ser_comentarios_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ser_comentarios_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "ser_comentarios_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "ser_comentarios_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "ser_comentarios_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "ser_comentarios_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "ser_comentarios_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "ser_comentarios_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
          {
            foreignKeyName: "ser_comentarios_colaborador_guia_del_flow_id_fkey"
            columns: ["guia_del_flow_id"]
            isOneToOne: false
            referencedRelation: "guia_del_flow"
            referencedColumns: ["id"]
          },
        ]
      }
      ser_puntajes: {
        Row: {
          aspecto_id: string
          created_at: string
          guia_del_flow_id: string
          id: string
          nota: string | null
          puntaje: number
          updated_at: string
        }
        Insert: {
          aspecto_id: string
          created_at?: string
          guia_del_flow_id: string
          id?: string
          nota?: string | null
          puntaje: number
          updated_at?: string
        }
        Update: {
          aspecto_id?: string
          created_at?: string
          guia_del_flow_id?: string
          id?: string
          nota?: string | null
          puntaje?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ser_puntajes_aspecto_id_fkey"
            columns: ["aspecto_id"]
            isOneToOne: false
            referencedRelation: "ser_aspectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ser_puntajes_guia_del_flow_id_fkey"
            columns: ["guia_del_flow_id"]
            isOneToOne: false
            referencedRelation: "guia_del_flow"
            referencedColumns: ["id"]
          },
        ]
      }
      vacantes: {
        Row: {
          cargo_id: string
          creado_por: string | null
          created_at: string
          descripcion: string | null
          empresa_id: string
          estado: Database["public"]["Enums"]["estado_vacante"]
          fecha_apertura: string
          fecha_cierre: string | null
          id: string
          titulo: string
        }
        Insert: {
          cargo_id: string
          creado_por?: string | null
          created_at?: string
          descripcion?: string | null
          empresa_id: string
          estado?: Database["public"]["Enums"]["estado_vacante"]
          fecha_apertura?: string
          fecha_cierre?: string | null
          id?: string
          titulo: string
        }
        Update: {
          cargo_id?: string
          creado_por?: string | null
          created_at?: string
          descripcion?: string | null
          empresa_id?: string
          estado?: Database["public"]["Enums"]["estado_vacante"]
          fecha_apertura?: string
          fecha_cierre?: string | null
          id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacantes_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacantes_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles_usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacantes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      verificaciones_saber: {
        Row: {
          bloque: Database["public"]["Enums"]["bloque_saber"]
          certificado_por: string | null
          ciclo_id: string | null
          colaborador_id: string
          created_at: string
          estado: Database["public"]["Enums"]["estado_verificacion"]
          evidencia_url: string | null
          fecha_verificacion: string
          id: string
          item_evaluado: string
          observaciones: string | null
        }
        Insert: {
          bloque: Database["public"]["Enums"]["bloque_saber"]
          certificado_por?: string | null
          ciclo_id?: string | null
          colaborador_id: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_verificacion"]
          evidencia_url?: string | null
          fecha_verificacion?: string
          id?: string
          item_evaluado: string
          observaciones?: string | null
        }
        Update: {
          bloque?: Database["public"]["Enums"]["bloque_saber"]
          certificado_por?: string | null
          ciclo_id?: string | null
          colaborador_id?: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_verificacion"]
          evidencia_url?: string | null
          fecha_verificacion?: string
          id?: string
          item_evaluado?: string
          observaciones?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verificaciones_saber_certificado_por_fkey"
            columns: ["certificado_por"]
            isOneToOne: false
            referencedRelation: "perfiles_usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verificaciones_saber_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ciclos_evaluacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verificaciones_saber_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verificaciones_saber_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "verificaciones_saber_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "verificaciones_saber_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "verificaciones_saber_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "verificaciones_saber_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "verificaciones_saber_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "verificaciones_saber_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
        ]
      }
    }
    Views: {
      v_360_detalle_evaluador: {
        Row: {
          dimension: Database["public"]["Enums"]["dimension_competencia"] | null
          evaluacion_id: string | null
          promedio: number | null
          tipo_evaluador: Database["public"]["Enums"]["tipo_evaluador"] | null
          total_respuestas: number | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluacion_tareas_evaluacion_id_fkey"
            columns: ["evaluacion_id"]
            isOneToOne: false
            referencedRelation: "evaluaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      v_alertas_proximas: {
        Row: {
          ciclo_evaluacion_id: string | null
          colaborador_empresa_id: string | null
          colaborador_id: string | null
          colaborador_nombre: string | null
          created_at: string | null
          descripcion: string | null
          dias_anticipacion: number | null
          empresa_id: string | null
          estado: Database["public"]["Enums"]["estado_alerta"] | null
          fecha_objetivo: string | null
          hoja_vida_formacion_id: string | null
          id: string | null
          nexa_ruta_formacion_disparada_id: string | null
          resuelta_en: string | null
          resuelta_por: string | null
          severidad: Database["public"]["Enums"]["severidad_alerta"] | null
          tipo: Database["public"]["Enums"]["tipo_alerta"] | null
          titulo: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alertas_ciclo_evaluacion_id_fkey"
            columns: ["ciclo_evaluacion_id"]
            isOneToOne: false
            referencedRelation: "ciclos_evaluacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "alertas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "alertas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "alertas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "alertas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "alertas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "alertas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
          {
            foreignKeyName: "alertas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_hoja_vida_formacion_id_fkey"
            columns: ["hoja_vida_formacion_id"]
            isOneToOne: false
            referencedRelation: "hoja_vida_formacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_resuelta_por_fkey"
            columns: ["resuelta_por"]
            isOneToOne: false
            referencedRelation: "perfiles_usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaboradores_empresa_id_fkey"
            columns: ["colaborador_empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_alertas_nexa_ruta"
            columns: ["nexa_ruta_formacion_disparada_id"]
            isOneToOne: false
            referencedRelation: "nexa_rutas_formacion"
            referencedColumns: ["id"]
          },
        ]
      }
      v_alineacion_talento_rol: {
        Row: {
          alineado: boolean | null
          colaborador_id: string | null
          empresa_id: string | null
          semaforo_hacer: string | null
          tiene_guia_flow: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      v_clima_equipo_resumen: {
        Row: {
          empresa_id: string | null
          enps: number | null
          indice_clima_general: number | null
          lider_id: string | null
          num_respuestas: number | null
          ronda_id: string | null
          umbral_respuestas: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clima_respuestas_equipo_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clima_respuestas_equipo_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "clima_respuestas_equipo_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "clima_respuestas_equipo_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "clima_respuestas_equipo_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "clima_respuestas_equipo_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "clima_respuestas_equipo_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "clima_respuestas_equipo_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
          {
            foreignKeyName: "clima_respuestas_ronda_id_fkey"
            columns: ["ronda_id"]
            isOneToOne: false
            referencedRelation: "clima_rondas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clima_respuestas_ronda_id_fkey"
            columns: ["ronda_id"]
            isOneToOne: false
            referencedRelation: "v_clima_ronda_resumen"
            referencedColumns: ["ronda_id"]
          },
          {
            foreignKeyName: "clima_rondas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      v_clima_ronda_resumen: {
        Row: {
          empresa_id: string | null
          enps: number | null
          estado: Database["public"]["Enums"]["estado_ronda_clima"] | null
          fecha_apertura: string | null
          fecha_cierre: string | null
          indice_clima_general: number | null
          nombre: string | null
          num_respuestas: number | null
          prom_comunicacion: number | null
          prom_condiciones: number | null
          prom_desarrollo: number | null
          prom_liderazgo: number | null
          prom_pertenencia: number | null
          prom_reconocimiento: number | null
          ronda_id: string | null
          umbral_respuestas: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clima_rondas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      v_indicadores_empresa: {
        Row: {
          activos_hace_12_meses: number | null
          alertas_abiertas: number | null
          alertas_criticas: number | null
          empresa_id: string | null
          en_proceso_salida: number | null
          pct_alineacion_talento_rol: number | null
          promedio_deber_empresa: number | null
          promedio_hacer_empresa: number | null
          promedio_saber_empresa: number | null
          salidas_ultimo_anio: number | null
          salidas_voluntarias_ultimo_anio: number | null
          tasa_rotacion_anual: number | null
          tasa_rotacion_voluntaria: number | null
          total_activos: number | null
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      v_indicadores_equipo: {
        Row: {
          alertas_criticas_abiertas: number | null
          empresa_id: string | null
          lider_id: string | null
          lider_nombre: string | null
          pdi_cumplidos: number | null
          pdi_pendientes: number | null
          promedio_deber: number | null
          promedio_hacer: number | null
          promedio_saber: number | null
          tamano_equipo: number | null
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      v_lideres_de_linea_sin_lider_interno: {
        Row: {
          colaborador_id: string | null
        }
        Relationships: []
      }
      v_nexa_curso_opciones: {
        Row: {
          id: string | null
          orden: number | null
          pregunta_id: string | null
          texto: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nexa_curso_opciones_pregunta_id_fkey"
            columns: ["pregunta_id"]
            isOneToOne: false
            referencedRelation: "nexa_curso_preguntas"
            referencedColumns: ["id"]
          },
        ]
      }
      v_organigrama_colaboradores_a_cargo: {
        Row: {
          colaborador_a_cargo_id: string | null
          colaborador_id: string | null
        }
        Relationships: []
      }
      v_organigrama_evaluadores: {
        Row: {
          colaborador_id: string | null
          evaluador_id: string | null
          tipo_evaluador: Database["public"]["Enums"]["tipo_evaluador"] | null
        }
        Relationships: []
      }
      v_organigrama_pares: {
        Row: {
          colaborador_id: string | null
          par_id: string | null
        }
        Relationships: []
      }
      v_rotacion_mensual: {
        Row: {
          empresa_id: string | null
          mes: string | null
          salidas: number | null
          salidas_voluntarias: number | null
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      v_saber_cumplimiento: {
        Row: {
          colaborador_id: string | null
          items_cumple: number | null
          items_parcial: number | null
          items_pendiente: number | null
          porcentaje_cumplimiento: number | null
          total_items: number | null
        }
        Relationships: [
          {
            foreignKeyName: "verificaciones_saber_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verificaciones_saber_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "verificaciones_saber_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "verificaciones_saber_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "verificaciones_saber_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "verificaciones_saber_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "verificaciones_saber_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "verificaciones_saber_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
        ]
      }
      v_ser_promedio: {
        Row: {
          colaborador_id: string | null
          promedio_ser: number | null
          total_aspectos_calificados: number | null
        }
        Relationships: [
          {
            foreignKeyName: "guia_del_flow_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guia_del_flow_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_alineacion_talento_rol"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "guia_del_flow_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_equipo"
            referencedColumns: ["lider_id"]
          },
          {
            foreignKeyName: "guia_del_flow_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_lideres_de_linea_sin_lider_interno"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "guia_del_flow_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_a_cargo_id"]
          },
          {
            foreignKeyName: "guia_del_flow_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_colaboradores_a_cargo"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "guia_del_flow_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "guia_del_flow_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "v_organigrama_pares"
            referencedColumns: ["par_id"]
          },
        ]
      }
    }
    Functions: {
      fn_calificar_intento_quiz: {
        Args: { p_respuestas: Json; p_ruta_id: string }
        Returns: {
          aprobado: boolean
          puntaje_pct: number
          umbral: number
        }[]
      }
      fn_clima_umbral: {
        Args: { p_empresa_id: string; p_poblacion: number }
        Returns: number
      }
      fn_debo_evaluar_a: {
        Args: { p_colaborador_id: string }
        Returns: boolean
      }
      fn_es_mi_equipo: { Args: { p_colaborador_id: string }; Returns: boolean }
      fn_generar_pdi_y_formacion_por_dimension: {
        Args: {
          p_dimension: string
          p_evaluacion_id: string
          p_semaforo: string
        }
        Returns: undefined
      }
      fn_mi_colaborador_id: { Args: never; Returns: string }
      fn_mi_empresa_id: { Args: never; Returns: string }
      fn_mi_rol: {
        Args: never
        Returns: Database["public"]["Enums"]["rol_usuario"]
      }
      fn_puedo_ver_respuestas_de: {
        Args: { p_evaluacion_tarea_id: string }
        Returns: boolean
      }
      fn_recalcular_resultados_evaluacion: {
        Args: { p_evaluacion_id: string }
        Returns: undefined
      }
      fn_soy_evaluador_de: {
        Args: { p_evaluacion_id: string }
        Returns: boolean
      }
      limpiar_espacios: { Args: { txt: string }; Returns: string }
      match_enum_label: {
        Args: { p_enum_type: unknown; p_raw_value: string }
        Returns: string
      }
      normalizar_texto: { Args: { txt: string }; Returns: string }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      bloque_evaluacion:
        | "competencias_organizacionales"
        | "competencias_funcionales"
        | "competencias_liderazgo"
        | "roles_y_funciones"
        | "cultura"
      bloque_saber:
        | "formacion_academica"
        | "habilidades_funcionales_tecnicas"
        | "certificaciones"
        | "experiencia"
      bloque_ser:
        | "esencia"
        | "emociones"
        | "pertenencia_compromiso"
        | "desafios"
      canal_notificacion: "email" | "whatsapp" | "in_app"
      categoria_dotacion: "elemento_personal" | "equipo_trabajo"
      categoria_induccion:
        | "proposito_organizacional"
        | "funciones"
        | "riesgos_sst"
        | "epp"
        | "examenes_medicos"
        | "formacion"
        | "otro"
      dimension_competencia: "hacer" | "deber"
      estado_alerta:
        | "pendiente"
        | "notificada"
        | "resuelta"
        | "vencida"
        | "descartada"
      estado_ciclo:
        | "planeado"
        | "abierto"
        | "en_consolidacion"
        | "publicado"
        | "cerrado"
      estado_colaborador:
        | "activo"
        | "inactivo"
        | "en_proceso_salida"
        | "periodo_prueba"
      estado_curso_colaborador:
        | "asignado"
        | "en_curso"
        | "completado"
        | "vencido"
      estado_dotacion: "entregado" | "devuelto" | "perdido" | "danado"
      estado_entrevista: "programada" | "realizada" | "cancelada"
      estado_pdi: "pendiente" | "en_curso" | "cumplido" | "vencido"
      estado_ronda_clima: "abierta" | "cerrada"
      estado_vacante: "abierta" | "pausada" | "cerrada"
      estado_verificacion: "cumple" | "cumple_parcial" | "no_cumple_pendiente"
      etapa_postulacion:
        | "recibido"
        | "entrevista"
        | "prueba"
        | "oferta"
        | "contratado"
        | "descartado"
      flow_documento_estado: "pendiente" | "generando" | "listo" | "error"
      flow_documento_tipo: "guia" | "carta"
      modalidad_entrevista: "presencial" | "virtual" | "telefonica"
      nivel_esperado: "bajo" | "medio" | "alto"
      nivel_riesgo_cargo: "alto" | "medio" | "bajo"
      origen_item_evaluacion: "competencia" | "funcion_cargo"
      origen_pdi: "hacer" | "deber" | "saber" | "ser" | "mixto"
      rol_usuario:
        | "admin_th"
        | "lider"
        | "colaborador"
        | "gerencia"
        | "auditor_externo"
      severidad_alerta: "info" | "atencion" | "critica"
      tipo_adjunto_feed: "ninguno" | "documento" | "link" | "video_imagen"
      tipo_alerta:
        | "contrato_vencimiento"
        | "periodo_prueba_fin"
        | "sst_examen_medico"
        | "sst_certificacion"
        | "sst_induccion"
        | "sst_epp"
        | "formacion_vencimiento"
        | "ciclo_evaluacion"
        | "cumpleanos"
        | "aniversario_ingreso"
        | "otro"
        | "aniversario_bodas"
        | "baby_shower"
        | "fecha_especial"
        | "dotacion_vencimiento"
      tipo_contrato:
        | "indefinido"
        | "fijo"
        | "obra_labor"
        | "prestacion_servicios"
        | "aprendizaje"
        | "externo"
      tipo_elemento_identidad: "principio" | "valor"
      tipo_evaluador: "autoevaluacion" | "lider" | "par" | "colaborador_a_cargo"
      tipo_habilidad: "funcional" | "tecnica"
      tipo_incapacidad:
        | "enfermedad_general"
        | "accidente_laboral"
        | "enfermedad_laboral"
        | "licencia_maternidad"
        | "licencia_paternidad"
        | "otra"
      tipo_publicacion:
        | "anuncio"
        | "politica_sst"
        | "reconocimiento"
        | "logro"
        | "general"
      tipo_umbral_clima: "cantidad" | "porcentaje"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      bloque_evaluacion: [
        "competencias_organizacionales",
        "competencias_funcionales",
        "competencias_liderazgo",
        "roles_y_funciones",
        "cultura",
      ],
      bloque_saber: [
        "formacion_academica",
        "habilidades_funcionales_tecnicas",
        "certificaciones",
        "experiencia",
      ],
      bloque_ser: [
        "esencia",
        "emociones",
        "pertenencia_compromiso",
        "desafios",
      ],
      canal_notificacion: ["email", "whatsapp", "in_app"],
      categoria_dotacion: ["elemento_personal", "equipo_trabajo"],
      categoria_induccion: [
        "proposito_organizacional",
        "funciones",
        "riesgos_sst",
        "epp",
        "examenes_medicos",
        "formacion",
        "otro",
      ],
      dimension_competencia: ["hacer", "deber"],
      estado_alerta: [
        "pendiente",
        "notificada",
        "resuelta",
        "vencida",
        "descartada",
      ],
      estado_ciclo: [
        "planeado",
        "abierto",
        "en_consolidacion",
        "publicado",
        "cerrado",
      ],
      estado_colaborador: [
        "activo",
        "inactivo",
        "en_proceso_salida",
        "periodo_prueba",
      ],
      estado_curso_colaborador: [
        "asignado",
        "en_curso",
        "completado",
        "vencido",
      ],
      estado_dotacion: ["entregado", "devuelto", "perdido", "danado"],
      estado_entrevista: ["programada", "realizada", "cancelada"],
      estado_pdi: ["pendiente", "en_curso", "cumplido", "vencido"],
      estado_ronda_clima: ["abierta", "cerrada"],
      estado_vacante: ["abierta", "pausada", "cerrada"],
      estado_verificacion: ["cumple", "cumple_parcial", "no_cumple_pendiente"],
      etapa_postulacion: [
        "recibido",
        "entrevista",
        "prueba",
        "oferta",
        "contratado",
        "descartado",
      ],
      flow_documento_estado: ["pendiente", "generando", "listo", "error"],
      flow_documento_tipo: ["guia", "carta"],
      modalidad_entrevista: ["presencial", "virtual", "telefonica"],
      nivel_esperado: ["bajo", "medio", "alto"],
      nivel_riesgo_cargo: ["alto", "medio", "bajo"],
      origen_item_evaluacion: ["competencia", "funcion_cargo"],
      origen_pdi: ["hacer", "deber", "saber", "ser", "mixto"],
      rol_usuario: [
        "admin_th",
        "lider",
        "colaborador",
        "gerencia",
        "auditor_externo",
      ],
      severidad_alerta: ["info", "atencion", "critica"],
      tipo_adjunto_feed: ["ninguno", "documento", "link", "video_imagen"],
      tipo_alerta: [
        "contrato_vencimiento",
        "periodo_prueba_fin",
        "sst_examen_medico",
        "sst_certificacion",
        "sst_induccion",
        "sst_epp",
        "formacion_vencimiento",
        "ciclo_evaluacion",
        "cumpleanos",
        "aniversario_ingreso",
        "otro",
        "aniversario_bodas",
        "baby_shower",
        "fecha_especial",
        "dotacion_vencimiento",
      ],
      tipo_contrato: [
        "indefinido",
        "fijo",
        "obra_labor",
        "prestacion_servicios",
        "aprendizaje",
        "externo",
      ],
      tipo_elemento_identidad: ["principio", "valor"],
      tipo_evaluador: ["autoevaluacion", "lider", "par", "colaborador_a_cargo"],
      tipo_habilidad: ["funcional", "tecnica"],
      tipo_incapacidad: [
        "enfermedad_general",
        "accidente_laboral",
        "enfermedad_laboral",
        "licencia_maternidad",
        "licencia_paternidad",
        "otra",
      ],
      tipo_publicacion: [
        "anuncio",
        "politica_sst",
        "reconocimiento",
        "logro",
        "general",
      ],
      tipo_umbral_clima: ["cantidad", "porcentaje"],
    },
  },
} as const
