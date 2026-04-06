import cfg from "../../config/config.json";
import shopCfg from "../../config/shop.json";
export const config = cfg;
export const shopConfig = shopCfg;
export const isAdmin = (id?: string | null) => !!id && cfg.admins.includes(id);
