import { DogBadge } from "../types/badge";
import { Dog } from "../types/dog";
import { Point, RoutePrivacy, Walk, WalkTag } from "../types/walk";
import { DogManagerModal } from "./DogManagerModal";
import { FeedScreen } from "./FeedScreen";
import { HomeScreen } from "./HomeScreen";
import { AppTab, HubScreen } from "./HubScreen";
import { HistoryScreen } from "./HistoryScreen";
import { MeScreen } from "./MeScreen";
import { WalkCompleteScreen } from "./WalkCompleteScreen";
import { WalkingScreen } from "./WalkingScreen";

type Props = {
  tab: AppTab;
  userId: string;
  dogs: Dog[];
  activeDog: Dog;
  walks: Walk[];
  badges: DogBadge[];
  isWalking: boolean;
  walkFinished: boolean;
  seconds: number;
  distance: number;
  points: Point[];
  walkTitle: string;
  routePrivacy: RoutePrivacy;
  walkTags: WalkTag[];
  isSaving: boolean;
  saveFailed: boolean;
  isSigningOut: boolean;
  dogManagerOpen: boolean;
  dogManagerEditId: string | null;
  onNavigate: (tab: AppTab) => void;
  onStartWalk: () => void;
  onStopWalk: () => void | Promise<void>;
  onSaveWalk: () => void | Promise<void>;
  onDiscardWalk: () => void | Promise<void>;
  onTitleChange: (value: string) => void;
  onTagsChange: (value: WalkTag[]) => void;
  onRoutePrivacyChange: (value: RoutePrivacy) => void;
  onOpenDogs: (editId: string | null) => void;
  onCloseDogs: () => void;
  onDogsChanged: () => void | Promise<void>;
  onSelectDog: (dogId: string) => void;
  onHideWalk: (walkId: number) => Promise<void>;
  onDeleteWalk: (walkId: number) => Promise<void>;
  onSignOut: () => void;
};

export function AppRouter(props: Props) {
  const {
    tab,
    userId,
    dogs,
    activeDog,
    walks,
    badges,
    isWalking,
    walkFinished,
    seconds,
    distance,
    points,
    walkTitle,
    routePrivacy,
    walkTags,
    isSaving,
    saveFailed,
    isSigningOut,
    dogManagerOpen,
    dogManagerEditId,
    onNavigate,
    onStartWalk,
  } = props;

  let content: React.ReactNode;
  if (walkFinished) {
    content = (
      <WalkCompleteScreen
        seconds={seconds}
        distance={distance}
        points={points}
        dogName={activeDog.name}
        title={walkTitle}
        routePrivacy={routePrivacy}
        tags={walkTags}
        isSaving={isSaving}
        saveFailed={saveFailed}
        onTitleChange={props.onTitleChange}
        onTagsChange={props.onTagsChange}
        onRoutePrivacyChange={props.onRoutePrivacyChange}
        onSave={props.onSaveWalk}
        onDiscard={props.onDiscardWalk}
      />
    );
  } else if (isWalking) {
    content = <WalkingScreen seconds={seconds} distance={distance} points={points} dogName={activeDog.name} onStopWalk={props.onStopWalk} />;
  } else if (tab === "me") {
    content = <MeScreen dog={activeDog} walks={walks} badges={badges} isSigningOut={isSigningOut} onNavigate={onNavigate} onStartWalk={onStartWalk} onEditDog={() => props.onOpenDogs(activeDog.id)} onHideWalk={props.onHideWalk} onDeleteWalk={props.onDeleteWalk} onSignOut={props.onSignOut} />;
  } else if (tab === "map") {
    content = <HistoryScreen dog={activeDog} walks={walks} badges={badges} onNavigate={onNavigate} onStartWalk={onStartWalk} />;
  } else if (tab === "community") {
    content = <FeedScreen dog={activeDog} viewerWalks={walks} onNavigate={onNavigate} onStartWalk={onStartWalk} />;
  } else if (tab !== "home") {
    content = <HubScreen tab={tab} walks={walks} dog={activeDog} onNavigate={onNavigate} onStartWalk={onStartWalk} />;
  } else {
    content = <HomeScreen walks={walks} dog={activeDog} onStartWalk={onStartWalk} onNavigate={onNavigate} onOpenDogs={() => props.onOpenDogs(null)} />;
  }

  return (
    <>
      {content}
      <DogManagerModal
        visible={dogManagerOpen}
        userId={userId}
        dogs={dogs}
        activeDogId={activeDog.id}
        initialEditDogId={dogManagerEditId}
        onClose={props.onCloseDogs}
        onChanged={props.onDogsChanged}
        onSelect={props.onSelectDog}
      />
    </>
  );
}
