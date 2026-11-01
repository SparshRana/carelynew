import {loadAlerts} from '@/lib/alert-store';
import {checkCloudCabinet} from '@/lib/cabinet-watch';
export const runtime='nodejs';
export const POST=(request:Request)=>checkCloudCabinet(request,loadAlerts);
