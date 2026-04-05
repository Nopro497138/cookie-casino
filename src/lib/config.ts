import cfg from "../../config/config.json";
export const config = cfg;
export const isAdmin = (id?: string | null) => !!id && cfg.admins.includes(id);
