import { getDashboardRouteForRole } from '@/lib/auth/auth-utils';
import { Role } from '@prisma/client';

describe('getDashboardRouteForRole', () => {
  it('should return the correct route for ADMIN', () => {
    expect(getDashboardRouteForRole(Role.ADMIN)).toBe('/admin');
  });

  it('should return the correct route for SUPERVISOR', () => {
    expect(getDashboardRouteForRole(Role.SUPERVISOR)).toBe('/admin');
  });

  it('should return the correct route for BSS', () => {
    expect(getDashboardRouteForRole(Role.BSS)).toBe('/admin/users');
  });

  it('should return the correct route for INFOSEC', () => {
    expect(getDashboardRouteForRole(Role.INFOSEC)).toBe('/admin/users');
  });

  it('should return the correct route for AGENT', () => {
    expect(getDashboardRouteForRole(Role.AGENT)).toBe('/admin/leads');
  });

  it('should return the login route for any other role', () => {
    // Using a role that is not explicitly handled
    // @ts-ignore
    expect(getDashboardRouteForRole('SOME_OTHER_ROLE')).toBe('/auth/login');
  });
});
