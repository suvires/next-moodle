import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { logger } from "@/lib/logger";
import {
  getChatsByCourses,
  getUserCourses,
  isAuthenticationError,
  resolveUserAccessProfile,
  type MoodleCourseAccessProfile,
} from "@/lib/moodle";
import type { MoodleChat } from "@/lib/moodle";
import { getCourseRoleLabel, getCourseRoleTone } from "@/lib/course-roles";
import { getSession } from "@/lib/session";

type ChatPageProps = {
  params: Promise<{
    courseId: string;
    chatId: string;
  }>;
};

function formatDate(value?: number) {
  if (!value) return null;
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value * 1000));
}

export default async function ChatPage({ params }: ChatPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const { courseId, chatId } = await params;
  const parsedCourseId = Number(courseId);
  const parsedChatId = Number(chatId);

  if (
    !Number.isInteger(parsedCourseId) ||
    parsedCourseId <= 0 ||
    !Number.isInteger(parsedChatId) ||
    parsedChatId <= 0
  ) {
    notFound();
  }

  let courses = [] as Awaited<ReturnType<typeof getUserCourses>>;
  let chat: MoodleChat | undefined;
  let errorMessage: string | null = null;
  let expiredSession = false;
  let courseAccess: MoodleCourseAccessProfile | null = null;

  try {
    const [coursesResult, chats, accessProfile] = await Promise.all([
      getUserCourses(session.token, session.userId),
      getChatsByCourses(session.token, [parsedCourseId]),
      resolveUserAccessProfile(session.token, session.userId).catch(
        () => null
      ),
    ]);

    courses = coursesResult;
    chat = chats.find((c) => c.id === parsedChatId);
    courseAccess =
      accessProfile?.courseCapabilities.find(
        (item) => item.courseId === parsedCourseId
      ) || null;
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Chat page load failed", {
      userId: session.userId,
      courseId: parsedCourseId,
      chatId: parsedChatId,
      error,
    });
    errorMessage = "No se pudo cargar la sala de chat.";
  }

  const course = courses.find((item) => item.id === parsedCourseId);

  if (!course && !errorMessage) {
    notFound();
  }

  if (!chat && !errorMessage) {
    notFound();
  }

  const effectiveCourseAccess: MoodleCourseAccessProfile =
    courseAccess || {
      courseId: parsedCourseId,
      fullname: course?.fullname || "Curso",
      shortname: course?.shortname || undefined,
      summary: course?.summary || undefined,
      roleBucket: "student",
      roles: [],
      canTeach: false,
      canEdit: false,
      canManageCourse: false,
      canManageParticipants: false,
      canViewGrades: true,
      canViewReports: false,
      adminOptions: {},
      navigationOptions: {},
    };

  return (
    <main className="flex min-h-screen flex-1 px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          sectionLabel="Chat"
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link href={`/mis-cursos/${parsedCourseId}`}>Volver</Link>
            </Button>
          }
        />

        <div>
          <div
            className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getCourseRoleTone(effectiveCourseAccess.roleBucket)}`}
          >
            {getCourseRoleLabel(effectiveCourseAccess.roleBucket)}
          </div>
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            {chat?.name || "Chat"}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {course?.fullname || "Curso"}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
            {effectiveCourseAccess.roleBucket === "student"
              ? "Esta vista está orientada a consultar la sala de chat y su próxima sesión programada."
              : "Esta vista mantiene la información básica de la sala, pero ya refleja tu rol real dentro del curso."}
          </p>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            {expiredSession
              ? "La sesion ya no es valida."
              : errorMessage}
          </div>
        ) : null}

        <Card className="rounded-xl">
          <CardContent className="px-5 py-5 md:px-6">
            <h2 className="text-lg font-semibold">Informacion</h2>
            <Separator className="my-3" />

            {chat?.chatTime ? (
              <div className="mb-4">
                <p className="text-xs text-[var(--color-muted)]">
                  Proxima sesion programada
                </p>
                <p className="mt-1 text-sm text-[var(--color-foreground)]">
                  {formatDate(chat.chatTime)}
                </p>
              </div>
            ) : null}

            {chat?.intro ? (
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                {chat.intro}
              </p>
            ) : null}

            <p className="mt-5 rounded-lg border border-[var(--color-muted)]/20 bg-[var(--color-muted)]/5 px-4 py-3 text-xs leading-5 text-[var(--color-muted)]">
              Las sesiones de chat se realizan en la plataforma principal.
              Aqui puedes ver la informacion de la sala.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
