import { permission } from "process";

export const internalPermissions = [
  { permission: "dashboard", group: "dashboard" },
  { permission: "event.create", group: "events" },
  { permission: "event.update", group: "events" },
  { permission: "event.show", group: "events" },
  { permission: "event.delete", group: "events" },
  { permission: "event.registration", group: "events" },
  { permission: "event.create Form", group: "events" },

  { permission: "post.create", group: "posts" },
  { permission: "post.update", group: "posts" },
  { permission: "post.show", group: "posts" },
  { permission: "post.delete", group: "posts" },

  { permission: "role.delete", group: "roles" },
  { permission: "role.create", group: "roles" },
  { permission: "role.index", group: "roles" },
  { permission: "role.delete", group: "roles" },
  { permission: "role.update", group: "roles" },

  {
    permission: "committee.create",
    group: "committees",
  },
  {
    permission: "committee.update",
    group: "committees",
  },
  {
    permission: "committee.show",
    group: "committees",
  },
  {
    permission: "committee.delete",
    group: "committees",
  },

  {
    permission: "member.index",
    group: "members",
  },
  {
    permission: "member.create",
    group: "members",
  },
  {
    permission: "member.update",
    group: "members",
  },
  {
    permission: "member.show",
    group: "members",
  },
  {
    permission: "member.delete",
    group: "members",
  },

  {
    permission: "award.create",
    group: "awards",
  },
  {
    permission: "award.update",
    group: "awards",
  },
  {
    permission: "award.show",
    group: "awards",
  },
  {
    permission: "award.delete",
    group: "awards",
  },
  {
    permission: "form.create",
    group: "forms",
  },
  {
    permission: "form.update",
    group: "forms",
  },
  {
    permission: "form.show",
    group: "forms",
  },
  {
    permission: "form.delete",
    group: "forms",
  },
  {
    permission: "form.submissions",
    group: "forms",
  },
];
