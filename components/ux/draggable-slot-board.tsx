"use client";

import { Reorder, motion } from "framer-motion";
import { GripVertical } from "lucide-react";
import { useState } from "react";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { scheduleSlots } from "@/lib/mock-data";

const initialSlots = scheduleSlots.flatMap((day) => day.slots.slice(0, 2).map((slot) => `${day.day} ${slot}`));

export function DraggableSlotBoard() {
  const [items, setItems] = useState(initialSlots);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Drag & Drop 슬롯 우선순위</CardTitle>
            <CardDescription>Mock UI입니다. 슬롯을 드래그해 운영 우선순위를 조정하는 느낌을 확인합니다.</CardDescription>
          </div>
          <Badge variant="outline">Keyboard focus ready</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-2">
          {items.map((item) => (
            <Reorder.Item key={item} value={item}>
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileDrag={{ scale: 1.03, boxShadow: "var(--shadow-lift)" }}
                className="flex cursor-grab items-center justify-between rounded-md border bg-background p-3 text-sm active:cursor-grabbing"
                tabIndex={0}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <span className="font-medium">{item}</span>
                </div>
                <span className="text-xs text-muted-foreground">예약 가능</span>
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </CardContent>
    </Card>
  );
}
