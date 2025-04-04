import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Marker } from './marker.model';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  constructor(private http: HttpClient) {}

  getMarkers(): Observable<Marker[]> {
    return this.http.get<Marker[]>('/assets/markers.json');
  }
}
