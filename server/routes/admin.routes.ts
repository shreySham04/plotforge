import { Router, Request, Response } from "express";
import { users, queuePersistence } from "../data/store.js";
import { requireOwner } from "../middleware/auth.js";

export const adminRouter = Router();

// Platform Owner: User Management
adminRouter.get("/users", requireOwner, (req: Request, res: Response) => {
  const safeUsers = users.map(({ passwordHash, ...u }) => ({
    ...u,
    isOwner: u.role === "OWNER" || u.role === "ADMIN"
  }));
  res.json(safeUsers);
});

adminRouter.delete("/users/:id", requireOwner, (req: Request, res: Response) => {
  const targetId = parseInt(req.params.id, 10);
  const index = users.findIndex(u => u.id === targetId);

  if (index === -1) {
    return res.status(404).json({ message: "User not found." });
  }

  const targetUser = users[index];
  if (targetUser.role === "OWNER") {
    return res.status(400).json({ message: "Cannot delete the primary platform owner account." });
  }

  users.splice(index, 1);
  queuePersistence();
  res.status(204).send();
});
