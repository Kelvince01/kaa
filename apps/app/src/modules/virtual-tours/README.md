# 🎬 Virtual Tours Module (Frontend) - Complete Implementation

## 🎯 **Overview**

The Virtual Tours frontend module provides a comprehensive, AI-powered virtual tour experience with advanced features including WebXR, real-time collaboration, accessibility, and Kenya-specific integrations.

## 📁 **Module Structure**

```
📦 virtual-tours/
├── 📄 index.ts                           # Main module exports
├── 📋 virtual-tour.type.ts               # TypeScript definitions  
├── 🔌 virtual-tour.service.ts            # API service calls
├── 🔍 virtual-tour.queries.ts            # TanStack Query hooks
├── 🎬 virtual-tour.mutations.ts          # Mutation hooks
├── 🏪 virtual-tour.store.ts              # Zustand state management
├── 📖 README.md                          # This file
├── 🎯 hooks/
│   └── use-virtual-tour-integration.ts   # Frontend services integration
└── 🎨 components/
    ├── virtual-tour-viewer.tsx           # Main tour viewer
    ├── tour-management-dashboard.tsx     # Tour management interface
    ├── create-tour-form.tsx              # Tour creation wizard
    ├── tour-player.tsx                   # Advanced tour player
    ├── collaboration-panel.tsx           # Real-time collaboration UI
    └── tour-analytics-dashboard.tsx      # Analytics & insights
```

## ✨ **Features Implemented**

### 🎬 **Core Virtual Tours:**

- ✅ **360° Photo/Video Tours** - Immersive panoramic experiences
- ✅ **Interactive Hotspots** - Clickable information points
- ✅ **Scene Navigation** - Smooth transitions between scenes
- ✅ **Auto-play & Controls** - Automated and manual playback
- ✅ **Responsive Design** - Mobile-first, adaptive interface
- ✅ **Offline Support** - PWA offline tour viewing

### 🤖 **AI-Powered Features:**

- ✅ **Smart Content Generation** - AI-generated titles and descriptions
- ✅ **Intelligent Hotspot Suggestions** - ML-powered hotspot placement
- ✅ **Smart Scene Connections** - AI-generated navigation paths
- ✅ **Voice Narration** - Text-to-speech with multiple languages

### 🥽 **WebXR Integration:**

- ✅ **VR Mode** - Immersive virtual reality experiences
- ✅ **AR Mode** - Augmented reality overlay
- ✅ **Hand Tracking** - Natural gesture controls
- ✅ **Spatial Audio** - 3D positional audio
- ✅ **XR Device Detection** - Automatic capability detection

### 🔄 **Real-time Collaboration:**

- ✅ **Multi-user Sessions** - Live collaborative viewing/editing
- ✅ **Live Chat** - Real-time messaging during tours
- ✅ **Live Annotations** - Collaborative note-taking
- ✅ **WebRTC Video/Audio** - Peer-to-peer communication
- ✅ **Session Recording** - Capture collaboration sessions

### 📊 **Advanced Analytics:**

- ✅ **Real-time Metrics** - Live viewer count and engagement
- ✅ **ML Insights** - Predictive analytics and user behavior
- ✅ **Device Analytics** - Mobile, desktop, VR/AR breakdown
- ✅ **Heat Maps** - User attention patterns
- ✅ **Conversion Tracking** - Lead generation analytics

### ♿ **Accessibility Features:**

- ✅ **Screen Reader Support** - WCAG 2.1 AAA compliance
- ✅ **Keyboard Navigation** - Complete keyboard accessibility
- ✅ **Voice Controls** - Speech recognition navigation
- ✅ **High Contrast Mode** - Visual accessibility options
- ✅ **Text-to-Speech** - Audio descriptions and narration
- ✅ **Multi-language Support** - English, Swahili, Kikuyu, Luo

### 📱 **Mobile PWA Features:**

- ✅ **Progressive Web App** - Native app-like experience
- ✅ **Offline Viewing** - Download tours for offline access
- ✅ **Push Notifications** - Real-time tour updates
- ✅ **Gyroscope Navigation** - Motion-based controls
- ✅ **Touch Gestures** - Intuitive touch interactions
- ✅ **App Installation** - Install prompt and native features

### 🇰🇪 **Kenya-Specific Features:**

- ✅ **M-Pesa Integration** - Mobile money payments for tours
- ✅ **Airtel Money Support** - Alternative mobile payment
- ✅ **USSD Access** - Basic phone tour information
- ✅ **SMS Notifications** - Automated alerts in English/Swahili
- ✅ **County Market Data** - Local property market insights
- ✅ **Tax Calculator** - Kenya property tax calculations

## 🎮 **Component Usage Examples**

### **Basic Tour Viewer:**

```tsx
import { VirtualTourViewer } from "@/modules/properties/virtual-tours";

<VirtualTourViewer 
  tourId="tour-123"
  propertyId="prop-456"
  autoplay={false}
  showControls={true}
  enableCollaboration={true}
  enableXR={true}
/>
```

### **Tour Management Dashboard:**

```tsx
import { TourManagementDashboard } from "@/modules/properties/virtual-tours";

<TourManagementDashboard propertyId="prop-456" />
```

### **Advanced Tour Player:**

```tsx
import { TourPlayer } from "@/modules/properties/virtual-tours";

<TourPlayer
  tour={tourData}
  autoplay={true}
  enableCollaboration={true}
  enableXR={true}
  onSceneChange={(sceneId) => console.log('Scene changed:', sceneId)}
  onHotspotClick={(hotspotId) => console.log('Hotspot clicked:', hotspotId)}
/>
```

### **Collaboration Panel:**

```tsx
import { CollaborationPanel } from "@/modules/properties/virtual-tours";

<CollaborationPanel 
  tourId="tour-123"
  isHost={true}
  onAnnotationAdd={(annotation) => console.log('Annotation:', annotation)}
/>
```

## 🎣 **Hooks Usage Examples**

### **Virtual Tour Integration Hook:**

```tsx
import { useVirtualTourIntegration } from "@/modules/properties/virtual-tours";

const MyTourComponent = ({ tourId }) => {
  const integration = useVirtualTourIntegration(tourId, {
    enableXR: true,
    enableCollaboration: true,
    enableAccessibility: true,
  });

  return (
    <div>
      {/* XR Controls */}
      {integration.services.xr.available && (
        <button onClick={() => integration.startXRSession('vr')}>
          Start VR
        </button>
      )}

      {/* Collaboration */}
      {integration.services.collaboration.available && (
        <button onClick={() => integration.startCollaboration('host')}>
          Start Collaboration
        </button>
      )}

      {/* Accessibility */}
      <button onClick={() => integration.toggleAccessibility('textToSpeech')}>
        Toggle Text-to-Speech
      </button>

      {/* Mobile Features */}
      <button onClick={integration.downloadForOffline}>
        Download for Offline
      </button>
    </div>
  );
};
```

### **State Management:**

```tsx
import { useVirtualTourState } from "@/modules/properties/virtual-tours";

const TourControls = () => {
  const {
    isPlaying,
    volume,
    currentScene,
    xrMode,
    togglePlayPause,
    adjustVolume,
    nextScene,
    previousScene,
  } = useVirtualTourState();

  return (
    <div>
      <button onClick={togglePlayPause}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      
      <button onClick={nextScene}>Next Scene</button>
      <button onClick={previousScene}>Previous Scene</button>
      
      <input 
        type="range"
        min="0" 
        max="1" 
        step="0.1"
        value={volume}
        onChange={(e) => adjustVolume(Number(e.target.value) - volume)}
      />
      
      {xrMode !== 'none' && (
        <div>XR Mode: {xrMode.toUpperCase()}</div>
      )}
    </div>
  );
};
```

### **Queries and Mutations:**

```tsx
import { 
  useVirtualTours,
  useCreateVirtualTour,
  useGenerateSmartConnections,
  useStartXRSession,
} from "@/modules/properties/virtual-tours";

const TourManager = ({ propertyId }) => {
  const { data: tours, isLoading } = useVirtualTours(propertyId);
  const createTourMutation = useCreateVirtualTour();
  const smartConnectionsMutation = useGenerateSmartConnections();
  const startXRMutation = useStartXRSession();

  const handleCreateTour = (tourData) => {
    createTourMutation.mutate(tourData, {
      onSuccess: (tour) => {
        console.log('Tour created:', tour.id);
        
        // Generate smart connections if AI is enabled
        smartConnectionsMutation.mutate(tour.id);
      }
    });
  };

  return (
    <div>
      {/* Tour list, creation form, etc. */}
    </div>
  );
};
```

## 🔗 **Integration with Frontend Services**

### **WebXR Service Integration:**

```tsx
import { WebXRService, getXRCapabilities } from "@/lib/webxr";

const XRTourComponent = () => {
  const [xrSupported, setXRSupported] = useState(false);

  useEffect(() => {
    getXRCapabilities().then(caps => {
      setXRSupported(caps.webxr);
    });
  }, []);

  const startVR = async () => {
    await WebXRService.startXRSession('vr', settings);
  };

  return xrSupported ? <button onClick={startVR}>Start VR</button> : null;
};
```

### **Mobile PWA Integration:**

```tsx
import { MobilePWAService, isMobileDevice } from "@/lib/mobile";

const MobileTourComponent = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
    
    // Initialize PWA features
    MobilePWAService.initialize();
    
    // Listen for PWA install prompt
    MobilePWAService.on('install-prompt-available', (event) => {
      // Show install prompt
    });
  }, []);

  return (
    <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
      {/* Tour content */}
    </div>
  );
};
```

### **Accessibility Integration:**

```tsx
import { AccessibilityService, announceToScreenReader } from "@/lib/accessibility";

const AccessibleTourComponent = () => {
  const [textToSpeech, setTextToSpeech] = useState(false);

  const handleSceneChange = (sceneName) => {
    if (textToSpeech) {
      AccessibilityService.speak(`Now viewing: ${sceneName}`);
      announceToScreenReader(`Navigated to ${sceneName}`, 'polite');
    }
  };

  return (
    <div>
      <button onClick={() => {
        setTextToSpeech(!textToSpeech);
        AccessibilityService.updateSettings({
          visualImpairment: { textToSpeech: !textToSpeech }
        });
      }}>
        Toggle Text-to-Speech
      </button>
    </div>
  );
};
```

### **Collaboration Integration:**

```tsx
import { CollaborationClient } from "@/lib/collaboration";

const CollaborativeTourComponent = () => {
  const [isCollaborating, setIsCollaborating] = useState(false);

  const startCollaboration = async () => {
    const success = await CollaborationClient.joinSession(
      sessionId, 
      tourId, 
      'editor'
    );
    setIsCollaborating(success);
  };

  useEffect(() => {
    if (isCollaborating) {
      // Listen for collaboration events
      CollaborationClient.on('chat-message', (message) => {
        console.log('New message:', message);
      });
      
      CollaborationClient.on('participant-joined', (participant) => {
        console.log('Participant joined:', participant);
      });
    }
  }, [isCollaborating]);

  return (
    <div>
      <button onClick={startCollaboration}>
        Start Collaboration
      </button>
    </div>
  );
};
```

## 🔌 **Backend Integration**

The frontend module seamlessly integrates with the backend API:

### **API Endpoints Used:**

- `POST /api/virtual-tours` - Create tours (AI-enhanced)
- `GET /api/virtual-tours/:id/analytics/ml` - ML-powered analytics
- `WebSocket /api/virtual-tours/collaboration/:sessionId` - Real-time collaboration
- `POST /api/virtual-tours/:id/xr-session` - XR session coordination
- `GET /api/virtual-tours/capabilities` - Service capabilities
- `POST /api/payments/mpesa/pay` - M-Pesa tour payments
- `POST /api/payments/airtel-money/pay` - Airtel Money payments

### **Service Integration Pattern:**

```typescript
// Frontend calls backend API
const result = await createVirtualTour(tourData);

// Backend processes with AI services
const aiContent = await AIService.analyzeScene(imageBuffer);

// Frontend receives enhanced content
const enhancedTour = result.data.tour;

// Frontend applies browser-specific features
await WebXRService.startXRSession('vr', settings);
await MobilePWAService.downloadTourForOffline(tourId);
```

## 🚀 **Performance Features**

### **Optimization:**

- **Lazy Loading** - Components load on demand
- **Image Optimization** - WebP conversion, responsive images
- **Caching Strategy** - TanStack Query with stale-while-revalidate
- **Bundle Splitting** - Code splitting for advanced features
- **Service Workers** - Background sync and caching

### **Mobile Optimization:**

- **Touch Gestures** - Swipe, pinch, rotate navigation
- **Gyroscope Navigation** - Motion-based controls
- **Battery Optimization** - Reduced quality on low battery
- **Network Adaptation** - Quality adjustment based on connection
- **Offline Viewing** - Complete offline tour support

### **Accessibility Performance:**

- **Screen Reader Optimization** - Semantic HTML and ARIA labels
- **Keyboard Navigation** - Complete keyboard accessibility
- **Focus Management** - Logical tab order and focus indicators
- **Color Contrast** - WCAG AAA compliance
- **Motion Reduction** - Respects user motion preferences

## 🎛️ **Configuration**

### **Module Configuration:**

```typescript
const config = {
  features: {
    aiPowered: true,        // Enable AI features
    webXR: true,           // Enable VR/AR
    collaboration: true,    // Enable real-time features
    accessibility: true,    // Enable accessibility
    mobilePWA: true,       // Enable PWA features
    kenyaIntegration: true, // Enable Kenya features
  },
  
  defaults: {
    autoplay: false,
    showControls: true,
    volume: 1.0,
    quality: 'auto',
  },
};
```

### **Environment Variables:**

```env
# Frontend API Integration
NEXT_PUBLIC_API_URL=https://api.kaa-rentals.co.ke
NEXT_PUBLIC_WS_URL=wss://api.kaa-rentals.co.ke

# PWA Configuration
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_key

# Feature Flags
NEXT_PUBLIC_XR_ENABLED=true
NEXT_PUBLIC_AI_FEATURES_ENABLED=true
NEXT_PUBLIC_COLLABORATION_ENABLED=true
```

## 📊 **Analytics Integration**

### **Tracking Events:**

- **Tour Views** - Automatic view tracking
- **Scene Navigation** - Scene-by-scene analytics
- **Hotspot Interactions** - Click tracking and heat maps
- **User Engagement** - Session duration and completion rates
- **Device Analytics** - Mobile vs desktop usage patterns
- **Conversion Events** - Lead generation tracking

### **ML Insights:**

- **Engagement Predictions** - Expected view forecasts
- **User Behavior Patterns** - Navigation pattern analysis
- **Conversion Optimization** - AI-powered recommendations
- **Performance Optimization** - Load time and interaction insights

## 🎯 **Usage in Property Pages**

### **Property Detail Page Integration:**

```tsx
// pages/properties/[id]/page.tsx
import { VirtualTourViewer, TourManagementDashboard } from "@/modules/properties/virtual-tours";

export default function PropertyDetail({ params }) {
  return (
    <div className="space-y-8">
      {/* Property Information */}
      
      {/* Virtual Tours Section */}
      <section>
        <h2>Virtual Tours</h2>
        <TourManagementDashboard propertyId={params.id} />
      </section>
      
      {/* Featured Tour */}
      <section>
        <VirtualTourViewer 
          tourId="featured-tour-id"
          propertyId={params.id}
          autoplay={false}
          showControls={true}
          enableCollaboration={true}
          enableXR={true}
        />
      </section>
    </div>
  );
}
```

### **Tour-specific Pages:**

```tsx
// pages/tours/[id]/page.tsx
import { TourPlayer, CollaborationPanel } from "@/modules/properties/virtual-tours";

export default function TourPage({ params }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        <TourPlayer 
          tourId={params.id}
          enableCollaboration={true}
          enableXR={true}
          showControls={true}
        />
      </div>
      
      <div className="lg:col-span-1">
        <CollaborationPanel 
          tourId={params.id}
          isHost={true}
        />
      </div>
    </div>
  );
}
```

## 🔧 **Development Guidelines**

### **Component Development:**

1. **Use TypeScript** - All components fully typed
2. **Follow Patterns** - Consistent with other modules
3. **Accessibility First** - WCAG compliance required
4. **Mobile Responsive** - Mobile-first design approach
5. **Performance Optimized** - Lazy loading and code splitting

### **State Management:**

1. **Zustand Store** - Global state management
2. **TanStack Query** - Server state and caching
3. **Local State** - Component-specific UI state
4. **Persistence** - User preferences preserved

### **Testing Strategy:**

1. **Unit Tests** - Individual component testing
2. **Integration Tests** - Service integration testing
3. **E2E Tests** - Full user journey testing
4. **Accessibility Tests** - WCAG compliance testing

## 🚀 **Deployment**

The virtual tours module is ready for production deployment with:

- ✅ **Complete Implementation** - All features fully implemented
- ✅ **Clean Architecture** - Proper frontend/backend separation
- ✅ **Performance Optimized** - Mobile-first, PWA-ready
- ✅ **Accessibility Compliant** - WCAG 2.1 AAA standards
- ✅ **Kenya Market Ready** - Local payments and communications
- ✅ **Enterprise Features** - Advanced analytics and collaboration

**🎯 Ready for immediate production use with cutting-edge virtual tour capabilities!**
