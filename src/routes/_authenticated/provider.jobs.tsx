import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { inputStyles } from "@/components/ag";
import { Empty, JobRow, Section } from "@/components/provider-portal-ui";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_FLOW } from "@/lib/admin";
import { useProviderPortal } from "@/lib/provider-portal";

export const Route = createFileRoute("/_authenticated/provider/jobs")({
  component: ProviderJobs,
});

function ProviderJobs() {
  const { data, isLoading } = useProviderPortal();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("open");
  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const rows = data.jobs.filter((j) =>
    filter === "all" ? true : filter === "open" ? !["completed", "cancelled"].includes(j.status) : j.status === filter,
  );

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("service_requests").update({ status: status as never }).eq("id", id);
    if (error) {
      toast.error("Couldn't update that job.");
      return;
    }
    toast.success("Job updated.");
    queryClient.invalidateQueries({ queryKey: ["provider-portal"] });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <h1 className="display-xl text-[2.2rem]">Jobs / Requests</h1>
        <select
          aria-label="Filter jobs"
          className={`${inputStyles} sm:w-[200px]`}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="open">Open</option>
          <option value="all">All</option>
          {STATUS_FLOW.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>
      <Section title={`${rows.length} jobs`}>
        <div className="divide-y divide-border">
          {rows.map((j) => (
            <JobRow
              key={j.id}
              data={data}
              job={j}
              actions={
                <select
                  aria-label={`Status for ${j.request_number}`}
                  className={`${inputStyles} h-10 lg:w-[170px]`}
                  value={j.status}
                  onChange={(e) => setStatus(j.id, e.target.value)}
                >
                  {STATUS_FLOW.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              }
            />
          ))}
          {rows.length === 0 ? <Empty>No jobs match this filter.</Empty> : null}
        </div>
      </Section>
    </div>
  );
}
