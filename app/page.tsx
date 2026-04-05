import { redirect } from "next/navigation";
import { PublicCourseCatalog } from "@/app/components/public-course-catalog";
import { PublicTopbar } from "@/app/components/public-topbar";
import { logger } from "@/lib/logger";
import { getSiteForceLogin } from "@/lib/moodle-brand";
import {
  getPublicCatalogCoursesWithServerToken,
  hasPublicCourseCatalogAccess,
  isAuthenticationError,
} from "@/lib/moodle";
import { getSession } from "@/lib/session";

type HomeProps = {
  searchParams: Promise<{
    q?: string;
    reason?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const session = await getSession();

  if (session) {
    redirect("/mis-cursos");
  }

  const [{ q, reason }, forceLogin] = await Promise.all([
    searchParams,
    getSiteForceLogin(),
  ]);

  // Moodle has forcelogin enabled — send unauthenticated users to the dedicated login page
  if (forceLogin) {
    const loginPath = reason === "session-expired"
      ? "/login?reason=session-expired"
      : "/login";
    redirect(loginPath);
  }

  // Moodle does not force login — show the public catalog
  const query = q?.trim() || "";
  const publicCatalogEnabled = hasPublicCourseCatalogAccess();
  let courses = [] as Awaited<ReturnType<typeof getPublicCatalogCoursesWithServerToken>>;
  let errorMessage: string | null = null;

  if (publicCatalogEnabled) {
    try {
      courses = await getPublicCatalogCoursesWithServerToken();
    } catch (error) {
      if (isAuthenticationError(error)) {
        errorMessage = "El catálogo público no está disponible en esta instalación.";
      } else {
        logger.error("Public catalog search failed", { query, error });
        errorMessage = "No se pudieron cargar los cursos disponibles ahora mismo.";
      }
    }
  } else {
    errorMessage = "El catálogo público no está disponible en esta instalación.";
  }

  return (
    <div className="flex min-h-svh flex-col bg-[var(--background)]">
      <PublicTopbar />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-5 py-8 md:px-8 md:py-10">
        <div className="flex flex-col gap-6">
          <section className="animate-rise-in flex flex-col gap-6">
            {errorMessage ? (
              <div className="banner-danger">{errorMessage}</div>
            ) : null}

            {!errorMessage ? (
              <PublicCourseCatalog courses={courses} initialQuery={query} />
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}
