"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Calendar, MessageSquare, Search } from "lucide-react";
import { Dropdown, Input, Label, Modal, Popover } from "@heroui/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { getMoodleMediaProxyUrl } from "@/lib/moodle-media";
import { logoutAction } from "@/app/actions/auth";
import { getUnreadNotificationsAction, markAllNotificationsReadAction } from "@/app/actions/notifications";
import type { MoodleNotification } from "@/lib/moodle";

type AppTopbarActionsProps = {
  fullName: string;
  userPictureUrl?: string;
  unreadMessages: number;
  unreadNotifications: number;
  canManageOwnFiles?: boolean;
};

function getInitials(name: string) {
  return (
    name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?"
  );
}

function BadgeDot({ count }: { count: number }) {
  return (
    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[0.6rem] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

const iconBtnClass =
  "relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface-strong)] hover:text-[var(--foreground)]";

export function AppTopbarActions({
  fullName,
  userPictureUrl,
  unreadMessages,
  unreadNotifications,
  canManageOwnFiles,
}: AppTopbarActionsProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifItems, setNotifItems] = useState<MoodleNotification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const router = useRouter();

  async function handleNotifOpenChange(open: boolean) {
    setNotifOpen(open);
    if (open) {
      setNotifLoading(true);
      const items = await getUnreadNotificationsAction();
      setNotifItems(items);
      setNotifLoading(false);
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    await markAllNotificationsReadAction();
    setNotifItems([]);
    setMarkingAll(false);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearchOpen(false);
    setQuery("");
    router.push(`/buscar?q=${encodeURIComponent(q)}`);
  }

  function handleDropdownAction(key: React.Key) {
    switch (String(key)) {
      case "perfil":   router.push("/perfil"); break;
      case "ajustes":  router.push("/ajustes"); break;
      case "archivos": router.push("/archivos"); break;
      case "salir":    logoutAction(); break;
    }
  }

  return (
    <div className="flex items-center gap-1">
      {/* Search */}
      <button
        aria-label="Buscar"
        onClick={() => setSearchOpen(true)}
        className={iconBtnClass}
      >
        <Search size={18} />
      </button>

      {/* Calendar */}
      <Link href="/calendario" aria-label="Calendario" className={iconBtnClass}>
        <Calendar size={18} />
      </Link>

      {/* Messages */}
      <Link href="/mensajes" aria-label="Mensajes" className={iconBtnClass}>
        <MessageSquare size={18} />
        {unreadMessages > 0 && <BadgeDot count={unreadMessages} />}
      </Link>

      {/* Notifications popover */}
      <Popover isOpen={notifOpen} onOpenChange={handleNotifOpenChange}>
        <Popover.Trigger>
          <button aria-label="Notificaciones" className={iconBtnClass}>
            <Bell size={18} />
            {unreadNotifications > 0 && <BadgeDot count={unreadNotifications} />}
          </button>
        </Popover.Trigger>
        <Popover.Content placement="bottom end" className="w-[340px] rounded-xl">
          <Popover.Dialog>
            <div className="flex items-center justify-between">
              <Popover.Heading className="text-sm font-semibold text-[var(--foreground)]">
                Notificaciones
              </Popover.Heading>
              {notifItems.length > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="text-xs text-[var(--muted)] transition hover:text-[var(--foreground)] disabled:opacity-50"
                >
                  {markingAll ? "Marcando..." : "Marcar todo como leído"}
                </button>
              )}
            </div>

            <div className="mt-2 flex flex-col">
              {notifLoading ? (
                <p className="py-6 text-center text-sm text-[var(--muted)]">Cargando...</p>
              ) : notifItems.length === 0 ? (
                <p className="py-6 text-center text-sm text-[var(--muted)]">No hay nuevas notificaciones.</p>
              ) : (
                notifItems.slice(0, 5).map((n) => (
                  <Link
                    key={n.id}
                    href={`/notificaciones/${n.id}`}
                    onClick={() => setNotifOpen(false)}
                    className="flex gap-2.5 border-t border-[var(--line)] py-2.5 hover:bg-[var(--surface-strong)] -mx-3 px-3 transition"
                  >
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--foreground)]">{n.subject}</p>
                      {n.fromUserName && (
                        <p className="text-xs text-[var(--muted)]">De: {n.fromUserName}</p>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>

            <div className="mt-2 border-t border-[var(--line)] pt-2">
              <Link
                href="/notificaciones"
                className="block text-center text-xs text-[var(--accent)] hover:underline"
                onClick={() => setNotifOpen(false)}
              >
                Ver todas las notificaciones
              </Link>
            </div>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>

      {/* Avatar dropdown */}
      <Dropdown>
        <Dropdown.Trigger>
          <Avatar
            aria-label="Menú de usuario"
            className="ml-3 h-8 w-8 shrink-0 cursor-pointer transition hover:opacity-75 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            {userPictureUrl && (
              <AvatarImage src={getMoodleMediaProxyUrl(userPictureUrl)} alt={fullName} />
            )}
            <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
          </Avatar>
        </Dropdown.Trigger>
        <Dropdown.Popover className="min-w-[192px] rounded-xl">
          <div className="px-3 pb-1 pt-3">
            <p className="text-sm font-medium text-[var(--foreground)]">{fullName}</p>
          </div>
          <Dropdown.Menu onAction={handleDropdownAction}>
            <Dropdown.Item id="perfil" textValue="Perfil">
              <Label>Perfil</Label>
            </Dropdown.Item>
            <Dropdown.Item id="ajustes" textValue="Ajustes">
              <Label>Ajustes</Label>
            </Dropdown.Item>
            {canManageOwnFiles ? (
              <Dropdown.Item id="archivos" textValue="Archivos">
                <Label>Archivos</Label>
              </Dropdown.Item>
            ) : null}
            <Dropdown.Item id="salir" textValue="Salir" variant="danger">
              <Label>Salir</Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>

      {/* Search modal */}
      <Modal.Backdrop isOpen={searchOpen} onOpenChange={setSearchOpen}>
        <Modal.Container placement="center" size="sm">
          <Modal.Dialog
            aria-label="Buscar"
            className="rounded-[var(--radius-lg)] border border-[var(--line)] shadow-[var(--shadow-md)]"
          >
            <Modal.CloseTrigger />
            <Modal.Header className="mb-4">
              <Modal.Heading className="text-xl font-semibold text-[var(--foreground)]">Buscar</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="overflow-visible">
              <form onSubmit={handleSearchSubmit} className="flex gap-2 p-0.5">
                <Input
                  autoFocus
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="¿Qué buscas?"
                  className="h-10 flex-1 rounded-[var(--radius)] border-[var(--line)] bg-[var(--surface-strong)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--line-strong)]"
                />
                <Button
                  type="submit"
                  className="h-10 rounded-[var(--radius)] bg-[var(--foreground)] px-4 text-sm font-medium text-white hover:opacity-90"
                >
                  Buscar
                </Button>
              </form>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
