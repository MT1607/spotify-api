import { Injectable } from '@nestjs/common';

@Injectable()
export class PlaylistService {
  constructor(private readonly playlistService: PlaylistService) {}
}
