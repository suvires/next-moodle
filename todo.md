# TODO

## Cobertura por rol

### Alumno
- Cubierto: acceso a cursos, consulta de módulos, tareas, calificaciones, foros, quiz, votación y resto de actividades ya visibles en la app.
- Cubierto en esta fase: acciones de intento, entrega y consulta quedan priorizadas en home, curso y actividades.
- Pendiente: completar más flujos extremos a extremos donde la app todavía solo muestra información parcial.

### Profesor
- Cubierto: seguimiento y revisión en home, detalle del curso, tareas, calificaciones, foros, discusión, votación, quiz y participantes.
- Cubierto en esta fase: se ocultan formularios claramente orientados a alumno cuando el rol no es de alumno.
- Cubierto en esta fase: tareas muestra envíos y calificaciones registradas; quiz permite revisar intentos por participante cuando Moodle lo autoriza.
- Cubierto en esta fase: existe una vista de reportes del curso y filtros iniciales en tareas.
- Cubierto en esta fase: el detalle de tarea permite guardar revisión básica con nota y comentario.
- Pendiente: reportes docentes más amplios, agregados históricos y acciones de moderación.

### Profesor con edición
- Cubierto: mismas superficies de seguimiento que profesor, con foco adicional de edición ligera y navegación rápida al curso.
- Cubierto en esta fase: acciones visibles distintas respecto a profesor simple en home y curso.
- Pendiente: edición real de actividades, wiki, base de datos y configuración ligera de curso desde la app.

### Gestor de curso
- Cubierto: administración amplia dentro de las superficies ya existentes, con foco en curso, participantes, calificaciones, catálogo y búsqueda.
- Cubierto en esta fase: home y curso muestran acciones más ejecutivas y de supervisión.
- Cubierto en esta fase: puede seguir envíos y revisión de quiz/tareas dentro de lo ya soportado.
- Pendiente: herramientas reales de administración de curso, participantes, reportes y configuración avanzada.

## Backlog técnico

### Profesor y gestor
- Extender la revisión de tareas más allá de la revisión básica actual: criterios más finos, acciones masivas y feedback más rico.
- Convertir la revisión docente de quiz en una vista aún más operativa: filtros, exportes o agregados más profundos.
- Crear acciones específicas para foros y calificaciones si se incorporan flujos de moderación o revisión avanzada.

### Edición ligera
- Mapear qué actividades soportan edición real en la API y cuáles deben seguir siendo solo de consulta.
- Priorizar wiki, base de datos y feedback si se quiere que `editing_teacher` tenga más valor tangible.

### Quiz y tareas
- Completar el ciclo de tarea con acciones de seguimiento más ricas si se añaden notas, filtros y estados de revisión.
- Decidir si merece la pena incorporar funciones adicionales de quiz para reportes o mantener la revisión docente apoyada en intentos por usuario.

### Consistencia
- Seguir propagando la matriz de acciones por rol a otras páginas secundarias si aparecen nuevas superficies.
- Mantener `lib/course-roles.ts` como fuente única para reglas de visibilidad y acciones.
