import {cloudGateway} from '@/lib/cloud-server';
export const runtime='nodejs';
export const GET=(request:Request)=>cloudGateway(request);
export const POST=(request:Request)=>cloudGateway(request);
export const PATCH=(request:Request)=>cloudGateway(request);
