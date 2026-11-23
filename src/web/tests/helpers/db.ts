import { execFileSync } from 'node:child_process'

const ANNOUNCEMENT_DB_CONTAINER = 'identity-announcement-db'
const ANNOUNCEMENT_DB = 'church_announcement_db'

function runSql(sql: string) {
  return execFileSync(
    'docker',
    [
      'exec',
      ANNOUNCEMENT_DB_CONTAINER,
      'sh',
      '-c',
      `mysql -uroot -p$MYSQL_ROOT_PASSWORD ${ANNOUNCEMENT_DB} -N -e "${sql}"`,
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  )
}

export interface SeedAnnouncement {
  title: string
  content: string
  priority?: string
  expiresAt?: string
}

/**
 * Announcement creation is broken for super-admin in the current build
 * (the announcement service resolves the caller's church via gRPC and
 * `super-admin` has no church mapping). We therefore seed fixtures directly
 * into the announcement service database for read/update/delete coverage.
 */
export function seedAnnouncement({ title, content, priority = 'HIGH', expiresAt = '2027-12-31 10:00:00' }: SeedAnnouncement) {
  const safe = (value: string) => value.replace(/'/g, "''")
  const sql =
    `INSERT INTO announcements ` +
    `(church_id,church_name,title,content,priority,roles_allowed,created_at,updated_at,deleted,expires_at) ` +
    `VALUES (5,'ALAGOMEJI','${safe(title)}','${safe(content)}','${priority}','[]',NOW(),NOW(),0,'${expiresAt}'); ` +
    `SELECT LAST_INSERT_ID();`
  runSql(sql)
}

/** Hard-delete every announcement created by this test run. */
export function cleanupAnnouncements(titlePrefix: string) {
  runSql(`DELETE FROM announcements WHERE title LIKE '${titlePrefix.replace(/'/g, "''")}%';`)
}

export function announcementCount(): number {
  const out = runSql('SELECT COUNT(*) FROM announcements;')
  return Number(out.trim()) || 0
}
