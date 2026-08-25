import { describe, it, expect } from "vitest";
import { OrderStatus } from "@erb/types";

describe("State Machine & Lifecycle Transitions", () => {
  const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.CREATED]: [OrderStatus.UPLOADED, OrderStatus.CANCELLED],
    [OrderStatus.UPLOADED]: [OrderStatus.WAITING_FOR_SHOP, OrderStatus.CANCELLED],
    [OrderStatus.WAITING_FOR_SHOP]: [
      OrderStatus.ACCEPTED,
      OrderStatus.REJECTED,
      OrderStatus.CANCELLED,
    ],
    [OrderStatus.ACCEPTED]: [OrderStatus.QUEUED, OrderStatus.CANCELLED],
    [OrderStatus.QUEUED]: [OrderStatus.PRINTING, OrderStatus.CANCELLED, OrderStatus.FAILED],
    [OrderStatus.PRINTING]: [OrderStatus.COMPLETED, OrderStatus.FAILED],
    [OrderStatus.COMPLETED]: [], // Terminal state
    [OrderStatus.FAILED]: [OrderStatus.QUEUED], // Can re-enqueue
    [OrderStatus.CANCELLED]: [], // Terminal state
    [OrderStatus.REJECTED]: [], // Terminal state
  };

  function canTransition(current: OrderStatus, next: OrderStatus): boolean {
    return VALID_ORDER_TRANSITIONS[current]?.includes(next) ?? false;
  }

  function isTerminal(status: OrderStatus): boolean {
    return [
      OrderStatus.COMPLETED,
      OrderStatus.CANCELLED,
      OrderStatus.REJECTED,
    ].includes(status);
  }

  it("allows standard happy path lifecycle progression", () => {
    expect(canTransition(OrderStatus.CREATED, OrderStatus.UPLOADED)).toBe(true);
    expect(canTransition(OrderStatus.UPLOADED, OrderStatus.WAITING_FOR_SHOP)).toBe(true);
    expect(canTransition(OrderStatus.WAITING_FOR_SHOP, OrderStatus.ACCEPTED)).toBe(true);
    expect(canTransition(OrderStatus.ACCEPTED, OrderStatus.QUEUED)).toBe(true);
    expect(canTransition(OrderStatus.QUEUED, OrderStatus.PRINTING)).toBe(true);
    expect(canTransition(OrderStatus.PRINTING, OrderStatus.COMPLETED)).toBe(true);
  });

  it("prevents skipping lifecycle stages", () => {
    expect(canTransition(OrderStatus.CREATED, OrderStatus.PRINTING)).toBe(false);
    expect(canTransition(OrderStatus.WAITING_FOR_SHOP, OrderStatus.COMPLETED)).toBe(false);
    expect(canTransition(OrderStatus.UPLOADED, OrderStatus.QUEUED)).toBe(false);
  });

  it("allows cancellation only before active printing begins", () => {
    expect(canTransition(OrderStatus.CREATED, OrderStatus.CANCELLED)).toBe(true);
    expect(canTransition(OrderStatus.UPLOADED, OrderStatus.CANCELLED)).toBe(true);
    expect(canTransition(OrderStatus.WAITING_FOR_SHOP, OrderStatus.CANCELLED)).toBe(true);
    expect(canTransition(OrderStatus.ACCEPTED, OrderStatus.CANCELLED)).toBe(true);
    expect(canTransition(OrderStatus.QUEUED, OrderStatus.CANCELLED)).toBe(true);
    expect(canTransition(OrderStatus.PRINTING, OrderStatus.CANCELLED)).toBe(false); // Cannot cancel while in progress
  });

  it("identifies terminal states properly", () => {
    expect(isTerminal(OrderStatus.COMPLETED)).toBe(true);
    expect(isTerminal(OrderStatus.CANCELLED)).toBe(true);
    expect(isTerminal(OrderStatus.REJECTED)).toBe(true);
    expect(isTerminal(OrderStatus.PRINTING)).toBe(false);
    expect(isTerminal(OrderStatus.QUEUED)).toBe(false);
  });

  it("allows failed jobs to be re-enqueued", () => {
    expect(canTransition(OrderStatus.FAILED, OrderStatus.QUEUED)).toBe(true);
  });
});
