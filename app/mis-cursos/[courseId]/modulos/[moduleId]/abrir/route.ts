import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getCourseContents, viewUrl } from "@/lib/moodle";
import { clearSessionIfAuthenticationError, getSession } from "@/lib/session";

type RouteContext = {
  params: Promise<{
    courseId: string;
    moduleId: string;
  }>;
};

function parsePositiveInteger(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(request: Request, context: RouteContext) {
  const session = await getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const { courseId, moduleId } = await context.params;
  const parsedCourseId = parsePositiveInteger(courseId);
  const parsedModuleId = parsePositiveInteger(moduleId);

  if (!parsedCourseId || !parsedModuleId) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const sections = await getCourseContents(session.token, parsedCourseId);
    const courseModule = sections
      .flatMap((section) => section.modules)
      .find((item) => item.id === parsedModuleId);

    if (!courseModule || !courseModule.userVisible || !courseModule.url) {
      return new Response("Not found", { status: 404 });
    }

    if (courseModule.modname === "url" && courseModule.instance) {
      await viewUrl(session.token, courseModule.instance);
    }

    return NextResponse.redirect(courseModule.url);
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) {
      return NextResponse.redirect(new URL("/auth/session-expired", request.url));
    }

    logger.error("Module redirect resolution failed", {
      userId: session.userId,
      courseId: parsedCourseId,
      moduleId: parsedModuleId,
      error,
    });

    return new Response("Upstream error", { status: 502 });
  }
}
