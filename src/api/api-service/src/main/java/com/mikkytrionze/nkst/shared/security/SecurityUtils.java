package com.mikkytrionze.nkst.shared.security;

import com.mikkytrionze.nkst.church.domain.repository.ChurchRepository;
import com.mikkytrionze.nkst.member.domain.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import com.mikkytrionze.nkst.church.domain.model.Church;
import com.mikkytrionze.nkst.shared.exception.ResourceNotFoundException;
import com.mikkytrionze.nkst.member.domain.model.Member;

@Component
@RequiredArgsConstructor
public class SecurityUtils {

    private final MemberRepository memberRepository;
    private final ChurchRepository churchRepository;

    /**
     * Resolves and returns the Church associated with the currently authenticated user.
     *
     * @return the user's {@link Church}
     * @throws ResourceNotFoundException if the user identifier cannot be resolved,
     *         the church ID is missing, or the church doesn't exist in the database.
     */
    public Church getLoggedInUserChurch() throws ResourceNotFoundException {
        try {
            String identifier = SecurityContextHolder.getContext().getAuthentication().getName();

            Long churchId = memberRepository.findChurchIdByIdentifier(identifier)
                    .orElseThrow(() -> new ResourceNotFoundException("User church not found"));

            return churchRepository.findById(churchId)
                    .orElseThrow(() -> new ResourceNotFoundException("User church not found"));

        } catch (NullPointerException e) {
            throw new ResourceNotFoundException(e.getMessage());
        } catch (Exception e) {
            throw new ResourceNotFoundException(e.getMessage());
        }
    }

    /**
     * Resolves and returns the Member entity associated with the currently authenticated user.
     *
     * @return the authenticated user's {@link Member}
     * @throws ResourceNotFoundException if the user identifier cannot be resolved
     *         or the member record does not exist in the database.
     */
    public Member getLoggedInUser() throws ResourceNotFoundException {
        try {
            String identifier = SecurityContextHolder.getContext().getAuthentication().getName();

            return memberRepository.findByIdentifier(identifier)
                    .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        } catch (NullPointerException e) {
            throw new ResourceNotFoundException("Authentication context is missing");
        } catch (Exception e) {
            throw new ResourceNotFoundException(e.getMessage());
        }
    }
}
