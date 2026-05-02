"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Alumno = {
  id: string;
  nombre: string;
  fechaVencimiento: string;
  cuotaAlDia: boolean;
};
type AlumnoRow = Database["public"]["Tables"]["alumnos"]["Row"];
type AlumnoInsert = Database["public"]["Tables"]["alumnos"]["Insert"];
type AlumnoUpdate = Database["public"]["Tables"]["alumnos"]["Update"];

function inicioDelDia(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function esCuotaAlDia(fechaISO: string) {
  const venc = inicioDelDia(new Date(fechaISO + "T12:00:00"));
  const hoy = inicioDelDia(new Date());
  return venc >= hoy;
}

function diasHastaVencimiento(fechaISO: string) {
  const venc = inicioDelDia(new Date(fechaISO + "T12:00:00"));
  const hoy = inicioDelDia(new Date());
  const msPorDia = 1000 * 60 * 60 * 24;
  return Math.round((venc.getTime() - hoy.getTime()) / msPorDia);
}

const formatoFecha = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function inicialNombre(nombre: string) {
  const t = nombre.trim();
  if (!t) return "?";
  return t.charAt(0).toLocaleUpperCase("es");
}

function LogoMark() {
  return (
    <div
      className="flex h-[72px] w-[72px] items-center justify-center rounded-[20px] bg-[#007AFF] shadow-lg shadow-[#007AFF]/35 transition-transform duration-300 hover:scale-[1.02]"
      aria-hidden
    >
      <svg
        className="h-9 w-9 text-white"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 12h16M7 8v8M17 8v8M5 6h2M5 18h2M17 6h2M17 18h2" />
      </svg>
    </div>
  );
}

function IconSignOut() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

function IconPencil() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#007AFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg
      className="h-5 w-5 text-[#007AFF]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconCheckCircle() {
  return (
    <svg
      className="h-5 w-5 text-[#34C759]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconAlertCircle() {
  return (
    <svg
      className="h-5 w-5 text-[#FF3B30]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-[#FF9500]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function Home() {
  const supabase = getSupabaseBrowserClient();

  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [formAbierto, setFormAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombreGimnasio, setNombreGimnasio] = useState("GymApp");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editFecha, setEditFecha] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [verificandoSesion, setVerificandoSesion] = useState(true);
  const [authCargando, setAuthCargando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function rowAAlumno(row: AlumnoRow): Alumno {
    return {
      id: row.id,
      nombre: row.nombre,
      fechaVencimiento: row.Fecha_vencimiento,
      cuotaAlDia: row.cuota_al_dia,
    };
  }

  async function cargarAlumnos() {
    setError(null);
    setCargando(true);
    const { data, error: dbError } = await supabase
      .from("alumnos")
      .select('id, created_at, nombre, "Fecha_vencimiento", cuota_al_dia')
      .order("nombre", { ascending: true });

    if (dbError) {
      setError(`No se pudo cargar la lista: ${dbError.message}`);
      setCargando(false);
      return;
    }

    setAlumnos((data ?? []).map(rowAAlumno));
    setCargando(false);
  }

  useEffect(() => {
    let activo = true;

    async function initSesion() {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!activo) return;

      if (sessionError) {
        setError(`No se pudo validar la sesión: ${sessionError.message}`);
      }
      setSession(data.session ?? null);
      setVerificandoSesion(false);
    }

    void initSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nuevaSesion) => {
      setSession(nuevaSesion);
      if (!nuevaSesion) {
        setAlumnos([]);
        setCargando(false);
        setFormAbierto(false);
        setEditandoId(null);
      }
    });

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session) {
      void cargarAlumnos();
      return;
    }
    setCargando(false);
  }, [session]);

  async function iniciarSesion(e: FormEvent) {
    e.preventDefault();
    if (authCargando) return;

    setError(null);
    setAuthCargando(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (loginError) {
      setError(`No se pudo iniciar sesión: ${loginError.message}`);
      setAuthCargando(false);
      return;
    }

    setPassword("");
    setAuthCargando(false);
  }

  async function cerrarSesion() {
    if (authCargando) return;

    setError(null);
    setAuthCargando(true);
    const { error: logoutError } = await supabase.auth.signOut();
    if (logoutError) {
      setError(`No se pudo cerrar sesión: ${logoutError.message}`);
      setAuthCargando(false);
      return;
    }
    setAuthCargando(false);
  }

  async function guardarNuevo(e: FormEvent) {
    e.preventDefault();
    const n = nombre.trim();
    if (!n || !fechaVencimiento || guardando) return;

    setError(null);
    setGuardando(true);
    const nuevoAlumno: AlumnoInsert = {
      nombre: n,
      Fecha_vencimiento: fechaVencimiento,
      cuota_al_dia: esCuotaAlDia(fechaVencimiento),
    };
    const { data, error: dbError } = await supabase
      .from("alumnos")
      .insert(nuevoAlumno as any)
      .select('id, created_at, nombre, "Fecha_vencimiento", cuota_al_dia')
      .single();

    if (dbError) {
      setError(`No se pudo guardar el alumno: ${dbError.message}`);
      setGuardando(false);
      return;
    }

    const alumnoNuevo = rowAAlumno(data);
    setAlumnos((prev) =>
      [...prev, alumnoNuevo].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    );
    setNombre("");
    setFechaVencimiento("");
    setFormAbierto(false);
    setGuardando(false);
  }

  function cancelarFormulario() {
    setNombre("");
    setFechaVencimiento("");
    setFormAbierto(false);
  }

  function toggleFormularioAgregar() {
    setEditandoId(null);
    setEditNombre("");
    setEditFecha("");
    setFormAbierto((v) => !v);
  }

  function empezarEdicion(a: Alumno) {
    setFormAbierto(false);
    setNombre("");
    setFechaVencimiento("");
    setEditandoId(a.id);
    setEditNombre(a.nombre);
    setEditFecha(a.fechaVencimiento);
  }

  async function guardarEdicion(e: FormEvent) {
    e.preventDefault();
    if (!editandoId || guardando) return;
    const n = editNombre.trim();
    if (!n || !editFecha) return;

    setError(null);
    setGuardando(true);
    const alumnoActualizadoPayload: AlumnoUpdate = {
      nombre: n,
      Fecha_vencimiento: editFecha,
      cuota_al_dia: esCuotaAlDia(editFecha),
    };
    const { data, error: dbError } = await (supabase as any)
      .from("alumnos")
      .update(alumnoActualizadoPayload)
      .eq("id", editandoId)
      .select('id, created_at, nombre, "Fecha_vencimiento", cuota_al_dia')
      .single();

    if (dbError) {
      setError(`No se pudo actualizar el alumno: ${dbError.message}`);
      setGuardando(false);
      return;
    }

    const alumnoActualizado = rowAAlumno(data);
    setAlumnos((prev) =>
      prev
        .map((x) => (x.id === alumnoActualizado.id ? alumnoActualizado : x))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    );
    setEditandoId(null);
    setEditNombre("");
    setEditFecha("");
    setGuardando(false);
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setEditNombre("");
    setEditFecha("");
  }

  async function eliminar(id: string) {
    if (guardando) return;
    setError(null);
    setGuardando(true);
    const { error: dbError } = await supabase.from("alumnos").delete().eq("id", id);

    if (dbError) {
      setError(`No se pudo eliminar el alumno: ${dbError.message}`);
      setGuardando(false);
      return;
    }

    setAlumnos((prev) => prev.filter((a) => a.id !== id));
    if (editandoId === id) cancelarEdicion();
    setGuardando(false);
  }

  const fieldClass =
    "w-full rounded-[12px] border-0 bg-[#E5E5EA] px-4 py-3.5 text-[15px] text-[#1C1C1E] outline-none transition-all placeholder:text-[#8E8E93] focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,122,255,0.22)] disabled:opacity-45";
  const totalAlumnos = alumnos.length;
  const alumnosAlDia = alumnos.filter((a) => a.cuotaAlDia).length;
  const alumnosVencidos = totalAlumnos - alumnosAlDia;
  const proximosAVencer = alumnos
    .map((a) => ({
      ...a,
      dias: diasHastaVencimiento(a.fechaVencimiento),
    }))
    .filter((a) => a.dias >= 0 && a.dias <= 7)
    .sort((a, b) => a.dias - b.dias);

  if (verificandoSesion) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#F2F2F7] px-6 py-16">
        <div className="rounded-[20px] bg-white px-8 py-6 text-center text-[15px] text-[#8E8E93] shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
          Verificando sesión...
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center bg-[#F2F2F7] px-6 py-12">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="scale-110">
            <LogoMark />
          </div>
          <div className="text-center">
            <h1 className="text-[28px] font-bold tracking-tight text-[#1C1C1E]">
              GymApp
            </h1>
            <p className="mt-1 text-[15px] text-[#8E8E93]">
              Gestion inteligente de tu gimnasio
            </p>
          </div>
        </div>

        <div className="w-full max-w-[380px] rounded-[22px] bg-white p-8 shadow-[0_12px_48px_rgba(0,0,0,0.1)]">
          <h2 className="text-center text-[20px] font-semibold text-[#1C1C1E]">
            Iniciar sesión
          </h2>
          <p className="mt-1 text-center text-[13px] text-[#8E8E93]">
            Ingresá con tu email y contraseña
          </p>

          {error ? (
            <p className="mt-5 rounded-[14px] bg-[#FF3B30]/10 px-4 py-3 text-center text-[13px] font-medium text-[#D70015]">
              {error}
            </p>
          ) : null}

          <form onSubmit={iniciarSesion} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="login-email"
                className="mb-2 block text-[13px] font-semibold text-[#8E8E93]"
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
                autoComplete="email"
                required
                disabled={authCargando}
              />
            </div>
            <div>
              <label
                htmlFor="login-password"
                className="mb-2 block text-[13px] font-semibold text-[#8E8E93]"
              >
                Contraseña
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClass}
                autoComplete="current-password"
                required
                disabled={authCargando}
              />
            </div>
            <button
              type="submit"
              disabled={authCargando}
              className="w-full rounded-full bg-[#007AFF] py-3.5 text-[16px] font-semibold text-white shadow-lg shadow-[#007AFF]/30 transition duration-200 hover:bg-[#0066DD] hover:shadow-xl hover:shadow-[#007AFF]/35 active:scale-[0.98] disabled:opacity-50"
            >
              {authCargando ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F2F2F7] px-4 pb-12 pt-6 sm:px-6">
      <div className="mx-auto max-w-lg">
        <header className="mb-8 rounded-[22px] bg-white px-6 py-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="scale-110">
                <LogoMark />
              </div>
              <div>
                <h1 className="text-[30px] font-bold tracking-tight text-[#1C1C1E]">
                  {nombreGimnasio}
                </h1>
                <p className="mt-1 text-[15px] text-[#8E8E93]">
                  Gestion inteligente de tu gimnasio
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleFormularioAgregar}
                disabled={guardando || authCargando}
                className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-5 py-2.5 text-[15px] font-semibold text-white shadow-lg shadow-[#007AFF]/28 transition duration-200 hover:bg-[#0066DD] hover:shadow-xl hover:shadow-[#007AFF]/32 active:scale-[0.98] disabled:opacity-45"
              >
                <IconPlus />
                {formAbierto ? "Cerrar" : "Agregar"}
              </button>
              <button
                type="button"
                onClick={cerrarSesion}
                disabled={authCargando || guardando}
                className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 py-2.5 text-[15px] font-semibold text-[#007AFF] shadow-sm transition duration-200 hover:bg-white hover:shadow-md active:scale-[0.98] disabled:opacity-45"
              >
                <IconSignOut />
                {authCargando ? "..." : "Salir"}
              </button>
            </div>
          </div>

          <div className="mt-5">
            <label
              htmlFor="nombre-gimnasio"
              className="mb-2 block text-[12px] font-semibold uppercase tracking-wide text-[#8E8E93]"
            >
              Nombre del gimnasio
            </label>
            <input
              id="nombre-gimnasio"
              type="text"
              value={nombreGimnasio}
              onChange={(e) => setNombreGimnasio(e.target.value)}
              className={fieldClass}
              placeholder="Nombre del gimnasio"
            />
            <p className="mt-2 text-[13px] text-[#8E8E93]">
              {session.user.email}
            </p>
          </div>
        </header>

        {error ? (
          <p className="mb-5 rounded-[16px] bg-[#FF3B30]/10 px-4 py-3 text-center text-[14px] font-medium text-[#D70015]">
            {error}
          </p>
        ) : null}

        {formAbierto && (
          <form
            onSubmit={guardarNuevo}
            className="mb-8 rounded-[20px] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)]"
          >
            <h2 className="text-[17px] font-semibold text-[#1C1C1E]">
              Nuevo alumno
            </h2>
            <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <label
                  htmlFor="nombre"
                  className="mb-2 block text-[13px] font-semibold text-[#8E8E93]"
                >
                  Nombre
                </label>
                <input
                  id="nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  autoComplete="name"
                  className={fieldClass}
                  placeholder="Nombre completo"
                  required
                  disabled={guardando}
                />
              </div>
              <div className="sm:w-44">
                <label
                  htmlFor="fecha"
                  className="mb-2 block text-[13px] font-semibold text-[#8E8E93]"
                >
                  Vencimiento
                </label>
                <input
                  id="fecha"
                  type="date"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                  className={fieldClass}
                  required
                  disabled={guardando}
                />
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={guardando}
                className="rounded-full bg-[#007AFF] px-6 py-2.5 text-[15px] font-semibold text-white shadow-md shadow-[#007AFF]/25 transition duration-200 hover:bg-[#0066DD] active:scale-[0.98] disabled:opacity-45"
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
              <button
                type="button"
                onClick={cancelarFormulario}
                disabled={guardando}
                className="rounded-full border border-black/[0.08] bg-white px-6 py-2.5 text-[15px] font-semibold text-[#007AFF] transition duration-200 hover:bg-[#F2F2F7] active:scale-[0.98] disabled:opacity-45"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-[20px] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.09)]">
            <div className="flex items-start justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                Total
              </p>
              <IconUsers />
            </div>
            <p className="mt-4 text-[40px] font-bold tabular-nums tracking-tight text-[#1C1C1E]">
              {totalAlumnos}
            </p>
          </div>
          <div className="rounded-[20px] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.09)]">
            <div className="flex items-start justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                Al día
              </p>
              <IconCheckCircle />
            </div>
            <p className="mt-4 text-[40px] font-bold tabular-nums tracking-tight text-[#34C759]">
              {alumnosAlDia}
            </p>
          </div>
          <div className="rounded-[20px] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.09)]">
            <div className="flex items-start justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                Vencida
              </p>
              <IconAlertCircle />
            </div>
            <p className="mt-4 text-[40px] font-bold tabular-nums tracking-tight text-[#FF3B30]">
              {alumnosVencidos}
            </p>
          </div>
        </section>

        <section className="mb-8 rounded-[18px] border border-[#FFCC00]/35 bg-[#FFF9E6] p-5 shadow-[0_6px_28px_rgba(255,149,0,0.14)]">
          <div className="flex items-center gap-2">
            <IconCalendar />
            <h2 className="text-[15px] font-semibold text-[#C93400]">
              Próximos 7 días
            </h2>
          </div>
          {proximosAVencer.length === 0 ? (
            <p className="mt-3 text-[14px] leading-relaxed text-[#8E8E93]">
              No hay vencimientos en la próxima semana.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {proximosAVencer.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-col gap-1 rounded-[14px] border border-[#FFCC00]/45 bg-white/90 px-4 py-3 text-[14px] shadow-sm transition hover:bg-white sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-semibold text-[#1C1C1E]">
                    {a.nombre}
                  </span>
                  <span className="text-[13px] text-[#C93400]">
                    {a.dias === 0
                      ? "Vence hoy"
                      : `En ${a.dias} día${a.dias === 1 ? "" : "s"} · ${formatoFecha.format(new Date(a.fechaVencimiento + "T12:00:00"))}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          {cargando ? (
            <div className="px-6 py-12 text-center text-[15px] text-[#8E8E93]">
              Cargando alumnos...
            </div>
          ) : null}
          <ul>
            {alumnos.map((a) => {
              const editando = editandoId === a.id;

              if (editando) {
                const alDiaEdit = editFecha ? esCuotaAlDia(editFecha) : false;
                return (
                  <li
                    key={a.id}
                    className="border-b border-[#F2F2F7] px-4 py-5 last:border-0"
                  >
                    <form
                      onSubmit={guardarEdicion}
                      className="flex flex-col gap-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                        <div className="min-w-0 flex-1">
                          <label
                            htmlFor="edit-nombre"
                            className="mb-2 block text-[13px] font-semibold text-[#8E8E93]"
                          >
                            Nombre
                          </label>
                          <input
                            id="edit-nombre"
                            type="text"
                            value={editNombre}
                            onChange={(e) => setEditNombre(e.target.value)}
                            autoComplete="name"
                            className={fieldClass}
                            required
                            disabled={guardando}
                          />
                        </div>
                        <div className="sm:w-44">
                          <label
                            htmlFor="edit-fecha"
                            className="mb-2 block text-[13px] font-semibold text-[#8E8E93]"
                          >
                            Vencimiento
                          </label>
                          <input
                            id="edit-fecha"
                            type="date"
                            value={editFecha}
                            onChange={(e) => setEditFecha(e.target.value)}
                            className={fieldClass}
                            required
                            disabled={guardando}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-3 text-[14px]">
                          <span
                            className={
                              alDiaEdit
                                ? "rounded-full bg-[#34C759]/14 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#248A3D]"
                                : "rounded-full bg-[#FF3B30]/14 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#D70015]"
                            }
                          >
                            {editFecha ? (alDiaEdit ? "Al día" : "Vencida") : "—"}
                          </span>
                          {editFecha ? (
                            <span className="tabular-nums text-[#8E8E93]">
                              Vence{" "}
                              <span className="font-medium text-[#1C1C1E]">
                                {formatoFecha.format(new Date(editFecha + "T12:00:00"))}
                              </span>
                            </span>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="submit"
                            disabled={guardando}
                            className="rounded-full bg-[#007AFF] px-5 py-2 text-[14px] font-semibold text-white shadow-md shadow-[#007AFF]/22 transition hover:bg-[#0066DD] active:scale-[0.98] disabled:opacity-45"
                          >
                            {guardando ? "Guardando..." : "Guardar"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelarEdicion}
                            disabled={guardando}
                            className="rounded-full border border-black/[0.08] bg-[#F2F2F7] px-5 py-2 text-[14px] font-semibold text-[#007AFF] transition hover:bg-[#E5E5EA] active:scale-[0.98] disabled:opacity-45"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </form>
                  </li>
                );
              }

              const alDia = a.cuotaAlDia;
              return (
                <li
                  key={a.id}
                  className="flex items-center gap-3 border-b-2 border-[#E5E5EA] px-5 py-4.5 transition-colors duration-200 last:border-0 hover:bg-[#F2F2F7]/60"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#007AFF]/12 text-[17px] font-semibold text-[#007AFF]">
                    {inicialNombre(a.nombre)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[17px] font-semibold text-[#1C1C1E]">
                      {a.nombre}
                    </p>
                    <p className="mt-0.5 text-[13px] text-[#8E8E93]">
                      Vence{" "}
                      {formatoFecha.format(new Date(a.fechaVencimiento + "T12:00:00"))}
                    </p>
                  </div>
                  <span
                    className={
                      alDia
                        ? "shrink-0 rounded-full bg-[#34C759]/14 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#248A3D]"
                        : "shrink-0 rounded-full bg-[#FF3B30]/14 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#D70015]"
                    }
                  >
                    {alDia ? "Al día" : "Vencida"}
                  </span>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => empezarEdicion(a)}
                      disabled={guardando}
                      className="rounded-full p-2.5 text-[#007AFF] transition hover:bg-[#007AFF]/10 active:scale-95 disabled:opacity-45"
                      aria-label="Editar"
                    >
                      <IconPencil />
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminar(a.id)}
                      disabled={guardando}
                      className="rounded-full p-2.5 text-[#FF3B30] transition hover:bg-[#FF3B30]/10 active:scale-95 disabled:opacity-45"
                      aria-label="Eliminar"
                    >
                      <IconTrash />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="mt-8 text-center text-[12px] text-[#8E8E93]">
          Sincronizado con Supabase
        </p>
        <footer className="mt-4 text-center text-[13px] font-medium text-[#8E8E93]">
          GymApp
        </footer>
      </div>
    </div>
  );
}
