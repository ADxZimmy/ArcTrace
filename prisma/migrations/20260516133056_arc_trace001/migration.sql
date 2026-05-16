-- DropForeignKey
ALTER TABLE "public"."feedback" DROP CONSTRAINT "feedback_trace_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."feedback" DROP CONSTRAINT "feedback_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."resolutions" DROP CONSTRAINT "resolutions_trace_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."sources" DROP CONSTRAINT "sources_trace_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."trace_payloads" DROP CONSTRAINT "trace_payloads_trace_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."traces" DROP CONSTRAINT "traces_agent_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."traces" DROP CONSTRAINT "traces_creator_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."traction_events" DROP CONSTRAINT "traction_events_user_id_fkey";

-- AddForeignKey
ALTER TABLE "traces" ADD CONSTRAINT "traces_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traces" ADD CONSTRAINT "traces_creator_user_id_fkey" FOREIGN KEY ("creator_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trace_payloads" ADD CONSTRAINT "trace_payloads_trace_id_fkey" FOREIGN KEY ("trace_id") REFERENCES "traces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sources" ADD CONSTRAINT "sources_trace_id_fkey" FOREIGN KEY ("trace_id") REFERENCES "traces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resolutions" ADD CONSTRAINT "resolutions_trace_id_fkey" FOREIGN KEY ("trace_id") REFERENCES "traces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_trace_id_fkey" FOREIGN KEY ("trace_id") REFERENCES "traces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traction_events" ADD CONSTRAINT "traction_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
