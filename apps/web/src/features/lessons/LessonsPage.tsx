import { LESSON_UNITS, LESSONS } from "@mainichi/core";
import { Course } from "./Course";

export default function LessonsPage() {
  return (
    <Course
      lessons={LESSONS}
      units={LESSON_UNITS}
      title="Lecciones desde cero"
      backLabel="Todas las lecciones"
    />
  );
}
