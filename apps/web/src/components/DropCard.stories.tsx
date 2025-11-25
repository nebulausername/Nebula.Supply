import type { Meta, StoryObj } from "@storybook/react";
import { DropCard } from "./DropCard";
import { drops } from "../data/drops";

const meta = {
  title: "Drops/DropCard",
  component: DropCard,
  args: {
    drop: drops[0],
    onOpen: () => {}
  }
} satisfies Meta<typeof DropCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Kostenlos: Story = {};
export const Limitiert: Story = {
  args: {
    drop: drops[1]
  }
};
export const VipLocked: Story = {
  args: {
    drop: drops[2]
  }
};
