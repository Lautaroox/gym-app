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

export default function Home() {
  const supabase = getSupabaseBrowserClient();

  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [formAbierto, setFormAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
    const { data, error: dbError } = await supabase
      .from("alumnos")
      .update(alumnoActualizadoPayload as any)
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

  const inputClass =
    "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400/30 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500";
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
      <div className="min-h-full bg-zinc-100 px-4 py-10 dark:bg-zinc-950">
        <div className="mx-auto max-w-md rounded-xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          Verificando sesión...
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-full bg-zinc-100 px-4 py-10 dark:bg-zinc-950">
        <div className="mx-auto max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Iniciar sesión
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Acceso para el dueño del gimnasio
          </p>

          {error ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <form onSubmit={iniciarSesion} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full ${inputClass}`}
                autoComplete="email"
                required
                disabled={authCargando}
              />
            </div>
            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                Contraseña
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full ${inputClass}`}
                autoComplete="current-password"
                required
                disabled={authCargando}
              />
            </div>
            <button
              type="submit"
              disabled={authCargando}
              className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {authCargando ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-zinc-100 px-4 py-10 dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Alumnos
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Cuotas y fechas de vencimiento
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
              Sesión: {session.user.email}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={toggleFormularioAgregar}
              disabled={guardando || authCargando}
              className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {formAbierto ? "Cerrar formulario" : "Agregar alumno"}
            </button>
            <button
              type="button"
              onClick={cerrarSesion}
              disabled={authCargando || guardando}
              className="shrink-0 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {authCargando ? "Cerrando..." : "Cerrar sesión"}
            </button>
          </div>
        </header>

        {error ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </p>
        ) : null}

        {formAbierto && (
          <form
            onSubmit={guardarNuevo}
            className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h2 className="mb-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Nuevo alumno
            </h2>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label
                  htmlFor="nombre"
                  className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                >
                  Nombre
                </label>
                <input
                  id="nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  autoComplete="name"
                  className={`w-full ${inputClass}`}
                  placeholder="Nombre completo"
                  required
                  disabled={guardando}
                />
              </div>
              <div className="sm:w-48">
                <label
                  htmlFor="fecha"
                  className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                >
                  Vencimiento de cuota
                </label>
                <input
                  id="fecha"
                  type="date"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                  className={`w-full ${inputClass}`}
                  required
                  disabled={guardando}
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={guardando}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
              <button
                type="button"
                onClick={cancelarFormulario}
                disabled={guardando}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Total alumnos
            </p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {totalAlumnos}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/30">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Cuota al día
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-800 dark:text-emerald-200">
              {alumnosAlDia}
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/30">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-800 dark:text-amber-300">
              Cuota vencida
            </p>
            <p className="mt-2 text-2xl font-semibold text-amber-900 dark:text-amber-200">
              {alumnosVencidos}
            </p>
          </div>
        </section>

        <section className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/30">
          <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Vencen en los próximos 7 días
          </h2>
          {proximosAVencer.length === 0 ? (
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-300">
              No hay alumnos con vencimiento próximo.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {proximosAVencer.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-col gap-1 rounded-lg border border-amber-300/70 bg-white/75 px-3 py-2 text-sm dark:border-amber-800/70 dark:bg-amber-950/20 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium text-amber-900 dark:text-amber-200">
                    {a.nombre}
                  </span>
                  <span className="text-amber-800 dark:text-amber-300">
                    {a.dias === 0
                      ? "Vence hoy"
                      : `Vence en ${a.dias} día${a.dias === 1 ? "" : "s"} (${formatoFecha.format(new Date(a.fechaVencimiento + "T12:00:00"))})`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {cargando ? (
            <div className="px-4 py-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
              Cargando alumnos...
            </div>
          ) : null}
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {alumnos.map((a) => {
              const editando = editandoId === a.id;

              if (editando) {
                const alDiaEdit = editFecha ? esCuotaAlDia(editFecha) : false;
                return (
                  <li key={a.id} className="px-4 py-4">
                    <form
                      onSubmit={guardarEdicion}
                      className="flex flex-col gap-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                        <div className="min-w-0 flex-1">
                          <label
                            htmlFor="edit-nombre"
                            className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                          >
                            Nombre
                          </label>
                          <input
                            id="edit-nombre"
                            type="text"
                            value={editNombre}
                            onChange={(e) => setEditNombre(e.target.value)}
                            autoComplete="name"
                            className={`w-full ${inputClass}`}
                            required
                            disabled={guardando}
                          />
                        </div>
                        <div className="sm:w-48">
                          <label
                            htmlFor="edit-fecha"
                            className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                          >
                            Vencimiento de cuota
                          </label>
                          <input
                            id="edit-fecha"
                            type="date"
                            value={editFecha}
                            onChange={(e) => setEditFecha(e.target.value)}
                            className={`w-full ${inputClass}`}
                            required
                            disabled={guardando}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span
                            className={
                              alDiaEdit
                                ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-600/15 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-500/25"
                                : "inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-500/25"
                            }
                          >
                            {editFecha ? (alDiaEdit ? "Al día" : "Vencida") : "—"}
                          </span>
                          {editFecha ? (
                            <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
                              Vence:{" "}
                              <span className="text-zinc-900 dark:text-zinc-200">
                                {formatoFecha.format(new Date(editFecha + "T12:00:00"))}
                              </span>
                            </span>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="submit"
                            disabled={guardando}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                          >
                            {guardando ? "Guardando..." : "Guardar cambios"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelarEdicion}
                            disabled={guardando}
                            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <span className="min-w-0 font-medium text-zinc-900 dark:text-zinc-100">
                    {a.nombre}
                  </span>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                      <span
                        className={
                          alDia
                            ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-600/15 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-500/25"
                            : "inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-500/25"
                        }
                      >
                        {alDia ? "Al día" : "Vencida"}
                      </span>
                      <span className="text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
                        Vence:{" "}
                        <span className="text-zinc-900 dark:text-zinc-200">
                          {formatoFecha.format(new Date(a.fechaVencimiento + "T12:00:00"))}
                        </span>
                      </span>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => empezarEdicion(a)}
                        disabled={guardando}
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminar(a.id)}
                        disabled={guardando}
                        className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-500">
          Datos sincronizados con Supabase
        </p>
      </div>
    </div>
  );
}
