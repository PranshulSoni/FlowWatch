import type { RequestHandler } from "express"

export interface IpFilterOptions {
  allow?: string[]
  deny?: string[]
}

function ipToInt(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) | parseInt(octet, 10), 0) >>> 0
}

function matchesCidr(ip: string, cidr: string): boolean {
  if (!cidr.includes("/")) return ip === cidr
  const [base, bits] = cidr.split("/")
  const prefixLen = parseInt(bits, 10)
  if (prefixLen === 0) return true
  const mask = (~0 << (32 - prefixLen)) >>> 0
  return (ipToInt(ip) & mask) === (ipToInt(base) & mask)
}

function matches(ip: string, list: string[]): boolean {
  return list.some((entry) => matchesCidr(ip, entry))
}

export function createIpFilterMiddleware({ allow, deny }: IpFilterOptions): RequestHandler {
  return (req, res, next) => {
    const ip = (req.ip ?? "").replace(/^::ffff:/, "")

    if (allow && !matches(ip, allow)) {
      res.status(403).json({ error: "Forbidden" })
      return
    }
    if (deny && matches(ip, deny)) {
      res.status(403).json({ error: "Forbidden" })
      return
    }
    next()
  }
}
