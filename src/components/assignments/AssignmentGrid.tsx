import { AssignmentCard } from "./AssignmentCard";
import { EmptyState } from "@/components/ui/Modal";
import type { AssignmentWithUploader } from "@/types";

interface AssignmentGridProps {
  assignments: AssignmentWithUploader[];
  emptyMessage?: string;
}

export function AssignmentGrid({ assignments, emptyMessage }: AssignmentGridProps) {
  if (assignments.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
        title="No assignments found"
        description={emptyMessage ?? "Try different search terms or filters."}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {assignments.map((a) => (
        <AssignmentCard key={a.id} assignment={a} />
      ))}
    </div>
  );
}
