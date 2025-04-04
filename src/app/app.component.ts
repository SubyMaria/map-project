/// <reference types="@types/google.maps" />

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from './data.service';
import { Marker } from './marker.model';
import { ToastrService } from 'ngx-toastr';

type MapMarker = Marker & {
  mapObject?: google.maps.Marker;
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  map: google.maps.Map | undefined;
  markers: MapMarker[] = [];
  filteredMarkers: MapMarker[] = [];
  selectedMarkers: MapMarker[] = [];
  directionsRenderer: google.maps.DirectionsRenderer | undefined;

  categories: string[] = [];
  selectedCategory = 'all';
  searchTerm = '';
  minPrice = 0;
  maxPrice = 1000;
  minRating = 0;

  isSidebarOpen = true;
  isMobile = false;

  constructor(
    private dataService: DataService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.initMap();
    this.loadMarkers();
    this.checkScreenSize();
    window.addEventListener('resize', this.checkScreenSize.bind(this));
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
    this.isSidebarOpen = !this.isMobile;
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  private initMap(): void {
    this.map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
      center: { lat: 40.7128, lng: -74.0060 },
      zoom: 12
    });

    this.directionsRenderer = new google.maps.DirectionsRenderer();
    this.directionsRenderer.setMap(this.map);
  }

  private loadMarkers(): void {
    this.dataService.getMarkers().subscribe((markers: Marker[]) => {
      this.markers = markers as MapMarker[];
      this.filteredMarkers = [...this.markers];
      this.categories = [...new Set(markers.map(m => m.category))];
      this.addMarkersToMap();
    });
  }

  private addMarkersToMap(): void {
    if (!this.map) return;

    // Clear old markers
    this.markers.forEach(marker => marker.mapObject?.setMap(null));

    this.filteredMarkers.forEach(marker => {
      const mapMarker = new google.maps.Marker({
        position: { lat: marker.lat, lng: marker.lng },
        map: this.map,
        title: marker.title
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="max-width: 250px; font-family: Arial, sans-serif;">
            <h3 style="margin: 0 0 10px;">${marker.title}</h3>
            ${marker.image ? `<img src="assets/${marker.image}" style="width: 100%; border-radius: 8px; margin-bottom: 10px;">` : ''}
            <p>${marker.description}</p>
            <p><strong>Price:</strong> $${marker.price ?? 'N/A'} | <strong>Rating:</strong> ${marker.rating ?? 'N/A'}</p>
            <button id="more-info-btn-${marker.lat}-${marker.lng}" style="background:#007bff;color:#fff;padding:6px 12px;border:none;border-radius:4px;">More Info</button>
          </div>
        `
      });

      mapMarker.addListener('click', () => {
        infoWindow.open(this.map!, mapMarker);

        if (this.selectedMarkers.length < 2 && !this.selectedMarkers.includes(marker)) {
          this.selectedMarkers.push(marker);
          mapMarker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');
        }

        google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
          const button = document.getElementById(`more-info-btn-${marker.lat}-${marker.lng}`);
          if (button) {
            button.addEventListener('click', () => {
              this.toastr.info(`More info about ${marker.title} coming soon!`, 'Info');
            });
          }
        });
      });

      marker.mapObject = mapMarker;
    });
  }

  filterMarkers(): void {
    this.selectedMarkers = [];
    this.filteredMarkers = this.markers.filter(marker => {
      const matchesCategory = this.selectedCategory === 'all' || marker.category === this.selectedCategory;
      const matchesSearch = marker.title.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesPrice = marker.price !== undefined && marker.price >= this.minPrice && marker.price <= this.maxPrice;
      const matchesRating = marker.rating !== undefined && marker.rating >= this.minRating;

      return matchesCategory && matchesSearch && matchesPrice && matchesRating;
    });

    this.addMarkersToMap();
  }

  clearSelection(): void {
    this.selectedMarkers = [];
    this.addMarkersToMap();
    this.directionsRenderer?.set('directions', null);
  }

  calculateDistance(): void {
    if (this.selectedMarkers.length !== 2) return;

    const [m1, m2] = this.selectedMarkers;
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(m1.lat, m1.lng),
      new google.maps.LatLng(m2.lat, m2.lng)
    );

    this.toastr.info(`Distance: ${(distance / 1000).toFixed(2)} km`, 'Distance Info');
  }

  routeToMarker(): void {
    if (this.selectedMarkers.length !== 1 || !this.map) return;

    navigator.geolocation.getCurrentPosition(position => {
      const origin = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      const destination = {
        lat: this.selectedMarkers[0].lat,
        lng: this.selectedMarkers[0].lng
      };

      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin,
          destination,
          travelMode: google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === 'OK') {
            this.directionsRenderer?.setDirections(result);
          } else {
            this.toastr.error('Failed to get route.', 'Routing Error');
          }
        }
      );
    }, () => {
      this.toastr.warning('Unable to retrieve your location.', 'Geolocation Error');
    });
  }
}
