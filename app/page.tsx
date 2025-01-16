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
      <Tabs defaultValue="account" className="w-[400px]">
        <TabsList className="mb-8">
          <TabsTrigger value="account">Salary Calculator</TabsTrigger>
          <TabsTrigger value="password">Book Planner</TabsTrigger>
        </TabsList>
        <main>
          <TabsContent value="account">
            <SalaryCalculator />
          </TabsContent>
          <TabsContent value="password">
            <BookPlanner />
          </TabsContent>
        </main>
      </Tabs>
    </div>
  );
}
