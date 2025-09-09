"use client";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { SalaryCalculator } from "./containers/SalaryCalculator";
import { BookPlanner } from "./containers/BookPlanner";

export default function Home() {
  return (
    <div className="m-8 flex justify-center font-[family-name:var(--font-geist-sans)]">
      <Tabs defaultValue="reading" className="w-[400px]">
        <TabsList className="mb-8">
          <TabsTrigger value="reading">📖 Read Planner</TabsTrigger>
          <TabsTrigger value="salary">💰 Salary Calculator</TabsTrigger>
        </TabsList>
        <main>
          <TabsContent value="reading">
            <BookPlanner />
          </TabsContent>
          <TabsContent value="salary">
            <SalaryCalculator />
          </TabsContent>
        </main>
      </Tabs>
    </div>
  );
}
