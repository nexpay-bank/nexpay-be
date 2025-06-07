import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi';

const adminOnly = async (request: Request, h: ResponseToolkit): Promise<ResponseObject | symbol> => {
  const role = request.auth.credentials?.role;

  if (role !== 'admin') {
    return h.response({
      status: 'fail',
      message: 'Akses ditolak: Hanya admin yang dapat mengakses endpoint ini.'
    }).code(403).takeover();
  }

  return h.continue;
};

const userOnly = async (request: Request, h: ResponseToolkit): Promise<ResponseObject | symbol> => {
  const role = request.auth.credentials?.role;

  if (role !== 'user') {
    return h.response({
      status: 'fail',
      message: 'Akses ditolak: Hanya user yang dapat mengakses endpoint ini.'
    }).code(403).takeover();
  }

  return h.continue;
};

export { adminOnly, userOnly };
