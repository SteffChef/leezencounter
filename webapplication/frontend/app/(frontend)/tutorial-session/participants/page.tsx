import { getParticipants } from "@/actions/get-participants";
import ParticipantCard from "@/app/(frontend)/tutorial-session/components/participant-card";
import { Participant } from "@/types";

const ParticipantsPage = async () => {
  const participants: Participant[] = await getParticipants();

  return (
    <div className="grid grid-cols-2 gap-4">
      {participants.map((participant) => (
        <ParticipantCard
          name={participant.name}
          role={participant.role}
          key={participant.id}
        />
      ))}
    </div>
  );
};

export default ParticipantsPage;
